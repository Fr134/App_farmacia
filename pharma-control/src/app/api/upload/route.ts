import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { parseCsvFile } from "@/lib/csv-parser";
import { validateCsvData } from "@/lib/csv-validator";
import * as reportService from "@/lib/report-service";
import type { ApiResponse } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // 1. Check file presence
    if (!file || !(file instanceof File)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Nessun file fornito" },
        { status: 400 }
      );
    }

    // 2. Check extension
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Il file deve avere estensione .csv" },
        { status: 400 }
      );
    }

    // 3. Check size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Il file supera il limite di 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Compute SHA-256 hash
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    // 5. Check duplicate hash
    if (await reportService.checkDuplicateHash(fileHash)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Questo file è già stato caricato" },
        { status: 409 }
      );
    }

    // 6. Parse CSV
    let parsed;
    try {
      parsed = parseCsvFile(buffer, file.name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante il parsing del CSV";
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: message },
        { status: 400 }
      );
    }

    // 7. Check duplicate period
    if (
      await reportService.checkDuplicatePeriod(
        parsed.period.month,
        parsed.period.year
      )
    ) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: `Esiste già un report per ${parsed.period.month}/${parsed.period.year}`,
        },
        { status: 409 }
      );
    }

    // 8. Validate parsed data
    const validation = validateCsvData(parsed);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse<{ errors: string[] }>>(
        {
          success: false,
          data: { errors: validation.errors },
          error: "Validazione fallita",
        },
        { status: 400 }
      );
    }

    // 9. Save to database
    const report = await reportService.createReport(parsed, fileHash);

    return NextResponse.json(
      {
        success: true,
        data: {
          reportId: report.id,
          period: {
            month: parsed.period.month,
            year: parsed.period.year,
          },
          warnings: validation.warnings,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
