import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as budgetService from "../services/budget.service";
import { ValidationError } from "../services/budget.service";

const router = Router();

router.use(authenticate);

// GET /api/budgets
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

    const budgets = await budgetService.getBudgets(pharmacyId);
    res.json({ success: true, data: { budgets } });
  })
);

// GET /api/budgets/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await budgetService.getBudgetById(req.params.id);

    if (!result) {
      res.status(404).json({
        success: false,
        error: "Budget non trovato",
      });
      return;
    }

    res.json({ success: true, data: result });
  })
);

// GET /api/budgets/:id/summary
router.get(
  "/:id/summary",
  asyncHandler(async (req, res) => {
    const summary = await budgetService.getBudgetSummaryById(req.params.id);

    if (!summary) {
      res.status(404).json({
        success: false,
        error: "Budget non trovato",
      });
      return;
    }

    res.json({ success: true, data: { summary } });
  })
);

const createBudgetSchema = z.object({
  pharmacyId: z.string().min(1, "pharmacyId obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  year: z.number().int().min(2000).max(2100),
  baselineSource: z.enum(["HISTORICAL", "MANUAL"]),
  baselineYear: z.number().int().min(2000).max(2100).optional(),
  globalAdjustmentPct: z.number().optional(),
  notes: z.string().optional(),
});

// POST /api/budgets (admin only)
router.post(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = createBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    try {
      const result = await budgetService.createBudget(parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      throw err;
    }
  })
);

const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  globalAdjustmentPct: z.number().nullable().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "ARCHIVED"]).optional(),
});

// PUT /api/budgets/:id (admin only)
router.put(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = updateBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const result = await budgetService.updateBudget(req.params.id, parsed.data);

    if (!result) {
      res.status(404).json({
        success: false,
        error: "Budget non trovato",
      });
      return;
    }

    res.json({ success: true, data: result });
  })
);

// DELETE /api/budgets/:id (admin only)
router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const result = await budgetService.deleteBudget(req.params.id);

    if (!result.success) {
      const status = result.error === "Budget non trovato" ? 404 : 403;
      res.status(status).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({ success: true });
  })
);

const updateRevenueLinesSchema = z.object({
  globalAdjustmentPct: z.number().nullable().optional(),
  lines: z
    .array(
      z.object({
        id: z.string().min(1),
        adjustmentMode: z.enum(["PCT_CHANGE", "ABSOLUTE", "NO_CHANGE"]),
        adjustmentPct: z.number().optional(),
        adjustmentAbsolute: z.number().optional(),
      })
    )
    .optional(),
});

// PUT /api/budgets/:id/revenue-lines (admin only)
router.put(
  "/:id/revenue-lines",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = updateRevenueLinesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const result = await budgetService.updateRevenueLines(
      req.params.id,
      parsed.data
    );

    if (!result) {
      res.status(404).json({
        success: false,
        error: "Budget non trovato",
      });
      return;
    }

    res.json({ success: true, data: result });
  })
);

const createExpenseLineSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  categoryLabel: z.string().min(1, "Categoria obbligatoria"),
  amountNet: z.number().positive("L'importo deve essere positivo"),
  vatRate: z.number().min(0).max(100).default(22),
  recurrenceType: z.enum(["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  notes: z.string().optional(),
});

// POST /api/budgets/:id/expense-lines (admin only)
router.post(
  "/:id/expense-lines",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = createExpenseLineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const result = await budgetService.createExpenseLine(
      req.params.id,
      parsed.data
    );

    if (!result) {
      res.status(404).json({
        success: false,
        error: "Budget non trovato",
      });
      return;
    }

    res.status(201).json({ success: true, data: result });
  })
);

const updateExpenseLineSchema = z.object({
  name: z.string().min(1).optional(),
  categoryLabel: z.string().min(1).optional(),
  amountNet: z.number().positive().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  recurrenceType: z.enum(["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
  notes: z.string().nullable().optional(),
});

// PUT /api/budgets/:id/expense-lines/:lineId (admin only)
router.put(
  "/:id/expense-lines/:lineId",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const parsed = updateExpenseLineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    try {
      const result = await budgetService.updateExpenseLine(
        req.params.id,
        req.params.lineId,
        parsed.data
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: "Voce di spesa non trovata",
        });
        return;
      }

      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      throw err;
    }
  })
);

// DELETE /api/budgets/:id/expense-lines/:lineId (admin only)
router.delete(
  "/:id/expense-lines/:lineId",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const result = await budgetService.deleteExpenseLine(
      req.params.id,
      req.params.lineId
    );

    if (!result.success) {
      const status =
        result.error === "Voce di spesa non trovata" ? 404 : 403;
      res.status(status).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({ success: true, data: { summary: result.summary } });
  })
);

export default router;
