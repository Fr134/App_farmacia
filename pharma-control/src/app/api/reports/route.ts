import { NextResponse } from "next/server";
import * as reportService from "@/lib/report-service";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const reports = await reportService.getAll();

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
