import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as expenseService from "../services/expense.service";

const router = Router();

router.use(authenticate, authorize("admin", "viewer"));

// GET /api/expense-categories
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pharmacyId = req.user!.pharmacyId;
    const categories = await expenseService.getAllCategories(pharmacyId);
    res.json({ success: true, data: { categories } });
  })
);

export default router;
