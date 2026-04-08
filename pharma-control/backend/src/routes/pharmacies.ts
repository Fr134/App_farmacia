import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as pharmacyService from "../services/pharmacy.service";

const router = Router();

router.use(authenticate, authorize("admin"));

// GET /api/pharmacies
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const pharmacies = await pharmacyService.getAll();
    res.json({ success: true, data: { pharmacies } });
  })
);

// GET /api/pharmacies/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const pharmacy = await pharmacyService.getById(req.params.id);
    if (!pharmacy) {
      res.status(404).json({ success: false, error: "Farmacia non trovata" });
      return;
    }
    res.json({ success: true, data: { pharmacy } });
  })
);

// POST /api/pharmacies
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1, "Nome obbligatorio"),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      adminName: z.string().min(1, "Nome admin obbligatorio"),
      adminEmail: z.string().email("Email admin non valida"),
      adminPassword: z.string().min(6, "Password minimo 6 caratteri"),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const pharmacy = await pharmacyService.createWithAdmin(parsed.data);
    res.status(201).json({ success: true, data: { pharmacy } });
  })
);

// PUT /api/pharmacies/:id
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const pharmacy = await pharmacyService.update(req.params.id, parsed.data);
    res.json({ success: true, data: { pharmacy } });
  })
);

// DELETE /api/pharmacies/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await pharmacyService.remove(req.params.id);
    res.json({ success: true, data: null });
  })
);

export default router;
