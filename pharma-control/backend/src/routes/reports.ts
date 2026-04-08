import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import * as reportService from "../services/report.service";
import { generateAlerts } from "../services/alert-engine";

const router = Router();

// All report routes require authentication and financial access (no operators)
router.use(authenticate, authorize("admin", "viewer"));

// GET /api/reports — list all reports
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const reports = await reportService.getAll(req.user!.pharmacyId);
    res.json({ success: true, data: reports });
  })
);

// GET /api/reports/aggregate — aggregate reports across a date range
router.get(
  "/aggregate",
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: "Parametri 'from' e 'to' obbligatori (formato: YYYY-MM)",
      });
      return;
    }

    const fromMatch = from.match(/^(\d{4})-(\d{2})$/);
    const toMatch = to.match(/^(\d{4})-(\d{2})$/);

    if (!fromMatch || !toMatch) {
      res.status(400).json({
        success: false,
        error: "Formato data non valido. Usare YYYY-MM (es: 2025-06)",
      });
      return;
    }

    const fromYear = parseInt(fromMatch[1], 10);
    const fromMonth = parseInt(fromMatch[2], 10);
    const toYear = parseInt(toMatch[1], 10);
    const toMonth = parseInt(toMatch[2], 10);

    if (fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
      res.status(400).json({
        success: false,
        error: "Il mese deve essere tra 01 e 12",
      });
      return;
    }

    if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
      res.status(400).json({
        success: false,
        error: "La data 'from' deve essere precedente o uguale a 'to'",
      });
      return;
    }

    const result = await reportService.getAggregate(fromMonth, fromYear, toMonth, toYear, req.user!.pharmacyId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: "Nessun report trovato nel periodo selezionato",
      });
      return;
    }

    res.json({ success: true, data: result });
  })
);

// GET /api/reports/quarterly-vat — IVA cumulativa trimestrale
router.get(
  "/quarterly-vat",
  asyncHandler(async (req, res) => {
    const monthStr = req.query.month as string | undefined;
    const yearStr = req.query.year as string | undefined;

    if (!monthStr || !yearStr) {
      res.status(400).json({
        success: false,
        error: "Parametri 'month' e 'year' obbligatori",
      });
      return;
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({
        success: false,
        error: "Il mese deve essere un numero tra 1 e 12",
      });
      return;
    }

    if (isNaN(year)) {
      res.status(400).json({
        success: false,
        error: "L'anno deve essere un numero valido",
      });
      return;
    }

    const data = await reportService.getQuarterlyVat(month, year, req.user!.pharmacyId);
    res.json({ success: true, data });
  })
);

// GET /api/reports/latest — get the most recent report
router.get(
  "/latest",
  asyncHandler(async (req, res) => {
    const report = await reportService.getLatest(req.user!.pharmacyId);

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

// GET /api/reports/:id/alerts — generate alerts for a report
router.get(
  "/:id/alerts",
  asyncHandler(async (req, res) => {
    const pharmacyId = req.user!.pharmacyId;
    const report = await reportService.getById(req.params.id, pharmacyId);

    if (!report) {
      res.status(404).json({
        success: false,
        error: "Report non trovato",
      });
      return;
    }

    const compareTo = req.query.compare_to as string | undefined;
    let comparison = null;

    if (compareTo) {
      comparison = await reportService.getById(compareTo, pharmacyId);
    }

    const result = generateAlerts(report, comparison);
    res.json({ success: true, data: result });
  })
);

// GET /api/reports/:id — get a specific report
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const report = await reportService.getById(req.params.id, req.user!.pharmacyId);

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

// DELETE /api/reports/:id — delete a report (admin only)
router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const deleted = await reportService.deleteById(req.params.id, req.user!.pharmacyId);

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
