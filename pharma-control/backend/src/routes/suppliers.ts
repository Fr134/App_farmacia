import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as expenseService from "../services/expense.service";

const router = Router();

router.use(authenticate);

// GET /api/suppliers
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pharmacyId = req.query.pharmacyId as string | undefined;

    if (!pharmacyId) {
      res.status(400).json({
        success: false,
        error: "Parametro 'pharmacyId' obbligatorio",
      });
      return;
    }

    const suppliers = await expenseService.getSuppliers(pharmacyId);
    res.json({ success: true, data: { suppliers } });
  })
);

const createSupplierSchema = z.object({
  pharmacyId: z.string().min(1, "pharmacyId obbligatorio"),
  ragioneSociale: z.string().min(1, "Ragione sociale obbligatoria"),
  piva: z.string().optional(),
  codiceFiscale: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/suppliers (admin only)
router.post(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = createSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const supplier = await expenseService.createSupplier(parsed.data);
    res.status(201).json({ success: true, data: { supplier } });
  })
);

export default router;
