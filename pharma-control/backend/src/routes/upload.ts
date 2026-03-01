import { Router } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { asyncHandler } from "../middleware/async-handler";
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

const router = Router();

router.post(
  "/",
  upload.single("file"),
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

    // 3. Check duplicate hash
    if (await reportService.checkDuplicateHash(fileHash)) {
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
        parsed.period.year
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
    const report = await reportService.createReport(parsed, fileHash);

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
