import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";
import { parseCsvFile } from "../services/csv-parser";
import { validateCsvData } from "../services/csv-validator";
import * as reportService from "../services/report.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Il file deve avere estensione .csv"));
      return;
    }
    cb(null, true);
  },
});

function handleMulterError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ success: false, error: "Il file supera il limite di 5 MB" });
      return;
    }
    res.status(400).json({ success: false, error: `Errore upload: ${err.message}` });
    return;
  }
  if (err.message) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  next(err);
}

const router = Router();

// Upload requires admin role
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("file"),
  handleMulterError,
  asyncHandler(async (req, res) => {
    const file = req.file;

    // 1. Check file presence
    if (!file) {
      res.status(400).json({
        success: false,
        error: "Nessun file fornito",
      });
      return;
    }

    // 2. Compute SHA-256 hash
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");

    const pharmacyId = req.user!.pharmacyId;

    // 3. Check duplicate hash
    if (await reportService.checkDuplicateHash(fileHash, pharmacyId)) {
      res.status(409).json({
        success: false,
        error: "Questo file è già stato caricato",
      });
      return;
    }

    // 4. Parse CSV
    let parsed;
    try {
      parsed = parseCsvFile(file.buffer, file.originalname);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante il parsing del CSV";
      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    // 5. Check duplicate period
    if (
      await reportService.checkDuplicatePeriod(
        parsed.period.month,
        parsed.period.year,
        pharmacyId
      )
    ) {
      res.status(409).json({
        success: false,
        error: `Esiste già un report per ${parsed.period.month}/${parsed.period.year}`,
      });
      return;
    }

    // 6. Validate parsed data
    const validation = validateCsvData(parsed);
    if (!validation.valid) {
      const errorDetail = validation.errors.join("; ");
      res.status(400).json({
        success: false,
        data: { errors: validation.errors },
        error: `Validazione fallita: ${errorDetail}`,
      });
      return;
    }

    // 7. Save to database
    const report = await reportService.createReport(parsed, fileHash, pharmacyId);

    res.status(201).json({
      success: true,
      data: {
        reportId: report.id,
        period: {
          month: parsed.period.month,
          year: parsed.period.year,
        },
        warnings: validation.warnings,
      },
    });
  })
);

export default router;
