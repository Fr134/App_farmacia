import { NextResponse } from "next/server";
import * as reportService from "@/lib/report-service";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const report = await reportService.getLatest();

    if (!report) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Nessun report trovato. Carica un CSV per iniziare.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("GET /api/reports/latest error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
