import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as sivatService from "../services/sivat.service";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── POST /api/sivat/assessments — create new assessment ──
router.post(
  "/assessments",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      patientName: z.string().min(1),
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
      answers: z.record(z.number().nullable()),
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

    const assessment = await sivatService.createAssessment(parsed.data, req.user!.userId);
    res.status(201).json({ success: true, data: { assessment } });
  })
);

// ── GET /api/sivat/assessments — list assessments ──
router.get(
  "/assessments",
  asyncHandler(async (req, res) => {
    const isOperator = req.user!.role === "operator";

    const filters: sivatService.ListFilters = {
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
    const assessment = await sivatService.getAssessment(req.params.id);
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
    await sivatService.deleteAssessment(req.params.id);
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

    const stats = await sivatService.getDashboardStats(dateFrom, dateTo);
    res.json({ success: true, data: stats });
  })
);

// ── GET /api/sivat/patients/:name — patient history ──
router.get(
  "/patients/:name",
  asyncHandler(async (req, res) => {
    const assessments = await sivatService.getPatientHistory(
      decodeURIComponent(req.params.name)
    );
    res.json({ success: true, data: { assessments } });
  })
);

export default router;
