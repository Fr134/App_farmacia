import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as expenseService from "../services/expense.service";

const router = Router();

router.use(authenticate, authorize("admin", "viewer"));

// GET /api/expense-categories
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await expenseService.getAllCategories();
    res.json({ success: true, data: { categories } });
  })
);

export default router;
