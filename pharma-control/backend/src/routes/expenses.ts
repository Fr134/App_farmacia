import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as expenseService from "../services/expense.service";

const router = Router();

router.use(authenticate);

// GET /api/expenses
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

    const categoryId = req.query.categoryId as string | undefined;
    const recurrenceType = req.query.recurrenceType as string | undefined;

    const result = await expenseService.getExpenses(pharmacyId, {
      categoryId,
      recurrenceType,
    });

    res.json({ success: true, data: result });
  })
);

// GET /api/expenses/summary
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const pharmacyId = req.query.pharmacyId as string | undefined;

    if (!pharmacyId) {
      res.status(400).json({
        success: false,
        error: "Parametro 'pharmacyId' obbligatorio",
      });
      return;
    }

    const summary = await expenseService.getExpenseSummary(pharmacyId);
    res.json({ success: true, data: summary });
  })
);

const createExpenseSchema = z.object({
  pharmacyId: z.string().min(1, "pharmacyId obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria obbligatoria"),
  supplierId: z.string().optional(),
  amountNet: z.number().positive("L'importo deve essere positivo"),
  vatRate: z.number().min(0).max(100).default(22),
  isVatDeductible: z.boolean().default(true),
  recurrenceType: z.enum(["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),
  isFixedCost: z.boolean().default(false),
  validFrom: z.string().min(1, "Data inizio obbligatoria"),
  validTo: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/expenses (admin only)
router.post(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const expense = await expenseService.createExpense(parsed.data);
    res.status(201).json({ success: true, data: { expense } });
  })
);

const updateExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().nullable().optional(),
  amountNet: z.number().positive().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  isVatDeductible: z.boolean().optional(),
  recurrenceType: z.enum(["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
  isFixedCost: z.boolean().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// PUT /api/expenses/:id (admin only)
router.put(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = updateExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const expense = await expenseService.updateExpense(req.params.id, parsed.data);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: "Spesa non trovata",
      });
      return;
    }

    res.json({ success: true, data: { expense } });
  })
);

// DELETE /api/expenses/:id — soft delete (admin only)
router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const expense = await expenseService.softDeleteExpense(req.params.id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: "Spesa non trovata",
      });
      return;
    }

    res.json({ success: true, data: { expense } });
  })
);

export default router;
