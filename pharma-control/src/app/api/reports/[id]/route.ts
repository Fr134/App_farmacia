import { NextRequest, NextResponse } from "next/server";
import * as reportService from "@/lib/report-service";
import type { ApiResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await reportService.getById(params.id);

    if (!report) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error(`GET /api/reports/${params.id} error:`, error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await reportService.deleteById(params.id);

    if (!deleted) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Report non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error(`DELETE /api/reports/${params.id} error:`, error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
