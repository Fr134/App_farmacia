import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as sivatService from "../services/sivat.service";

const router = Router();

// All routes require authentication
router.use(authenticate);

const patientSchema = z.object({
  id: z.string().min(1).nullable().optional(),
  fullName: z.string().trim().min(1, "Nome e cognome obbligatori").max(200),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data di nascita non valida")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).nullable().optional(),
  fiscalCode: z.string().max(32).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

function sendSivatError(err: unknown, res: import("express").Response): boolean {
  if (err instanceof sivatService.SivatValidationError) {
    res.status(400).json({ success: false, error: err.message });
    return true;
  }
  return false;
}

// ── GET /api/sivat/clients — patient registry (search with ?q=) ──
router.get(
  "/clients",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const patients = await sivatService.listPatients(req.user!.pharmacyId, q);
    res.json({ success: true, data: { patients } });
  })
);

// ── GET /api/sivat/clients/:id — patient + latest assessment (for prefill) ──
router.get(
  "/clients/:id",
  asyncHandler(async (req, res) => {
    const result = await sivatService.getPatientWithLatestAssessment(req.params.id, req.user!.pharmacyId);
    if (!result) {
      res.status(404).json({ success: false, error: "Cliente non trovato" });
      return;
    }
    res.json({ success: true, data: result });
  })
);

// ── PUT /api/sivat/clients/:id — update patient registry data ──
router.put(
  "/clients/:id",
  asyncHandler(async (req, res) => {
    const parsed = patientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Dati non validi: " + parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    try {
      const patient = await sivatService.updatePatient(req.params.id, parsed.data, req.user!.pharmacyId);
      res.json({ success: true, data: { patient } });
    } catch (err) {
      if (!sendSivatError(err, res)) throw err;
    }
  })
);

// ── POST /api/sivat/assessments — create new assessment ──
router.post(
  "/assessments",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      patient: patientSchema,
      scoreA: z.number().int().min(0).max(20),
      scoreB: z.number().int().min(0).max(25),
      scoreC: z.number().int().min(0).max(15),
      scoreD: z.number().int().min(0).max(15),
      scoreE: z.number().int().min(0).max(15).nullable(),
      sectionEEnabled: z.boolean(),
      supportLevel: z.number().int().min(0).max(3).nullable(),
      totalScore: z.number().int().min(0).max(100),
      rawScore: z.number().int().min(0),
      maxPossible: z.number().int(),
      classification: z.enum(["ALTA", "BUONA", "PARZIALE", "NON_ADERENZA"]),
      pdcPercentage: z.number().nullable().optional(),
      pdcDaysCovered: z.number().int().nullable().optional(),
      pdcDaysObserved: z.number().int().nullable().optional(),
      answers: z.record(z.union([z.number().nullable(), z.string().nullable(), z.boolean(), z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))])),
      criticalities: z.array(z.string()),
      interventions: z.array(z.string()),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Dati non validi: " + parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    try {
      const assessment = await sivatService.createAssessment(parsed.data, req.user!.userId, req.user!.pharmacyId);
      res.status(201).json({ success: true, data: { assessment } });
    } catch (err) {
      if (!sendSivatError(err, res)) throw err;
    }
  })
);

// ── GET /api/sivat/assessments — list assessments ──
router.get(
  "/assessments",
  asyncHandler(async (req, res) => {
    const isOperator = req.user!.role === "operator";

    const filters: sivatService.ListFilters = {
      pharmacyId: req.user!.pharmacyId,
      patientName: req.query.patientName as string | undefined,
      classification: req.query.classification as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
    };

    // Operators can only see their own assessments
    if (isOperator) {
      filters.userId = req.user!.userId;
    }

    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const result = await sivatService.listAssessments(filters);
    res.json({ success: true, data: result });
  })
);

// ── GET /api/sivat/assessments/:id — get single assessment ──
router.get(
  "/assessments/:id",
  asyncHandler(async (req, res) => {
    const assessment = await sivatService.getAssessment(req.params.id, req.user!.pharmacyId);
    if (!assessment) {
      res.status(404).json({ success: false, error: "Valutazione non trovata" });
      return;
    }
    res.json({ success: true, data: { assessment } });
  })
);

// ── DELETE /api/sivat/assessments/:id — admin only ──
router.delete(
  "/assessments/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    await sivatService.deleteAssessment(req.params.id, req.user!.pharmacyId);
    res.json({ success: true, data: null });
  })
);

// ── GET /api/sivat/dashboard — admin + viewer ──
router.get(
  "/dashboard",
  authorize("admin", "viewer"),
  asyncHandler(async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const stats = await sivatService.getDashboardStats(req.user!.pharmacyId, dateFrom, dateTo);
    res.json({ success: true, data: stats });
  })
);

// ── GET /api/sivat/patients/:name — patient history ──
router.get(
  "/patients/:name",
  asyncHandler(async (req, res) => {
    const assessments = await sivatService.getPatientHistory(
      decodeURIComponent(req.params.name),
      req.user!.pharmacyId
    );
    res.json({ success: true, data: { assessments } });
  })
);

export default router;
