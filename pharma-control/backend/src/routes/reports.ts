import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as reportService from "../services/report.service";

const router = Router();

// GET /api/reports — list all reports
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const reports = await reportService.getAll();
    res.json({ success: true, data: reports });
  })
);

// GET /api/reports/latest — get the most recent report
router.get(
  "/latest",
  asyncHandler(async (_req, res) => {
    const report = await reportService.getLatest();

    if (!report) {
      res.status(404).json({
        success: false,
        error: "Nessun report trovato. Carica un CSV per iniziare.",
      });
      return;
    }

    res.json({ success: true, data: report });
  })
);

// GET /api/reports/:id — get a specific report
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const report = await reportService.getById(req.params.id);

    if (!report) {
      res.status(404).json({
        success: false,
        error: "Report non trovato",
      });
      return;
    }

    res.json({ success: true, data: report });
  })
);

// DELETE /api/reports/:id — delete a report
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await reportService.deleteById(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Report non trovato",
      });
      return;
    }

    res.json({ success: true, data: { deleted: true } });
  })
);

export default router;
