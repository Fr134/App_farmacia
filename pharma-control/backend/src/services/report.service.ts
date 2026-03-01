import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  ParsedReport,
  SerializedReport,
  SerializedSectorData,
  ReportWithSectors,
} from "../types";

type PrismaReport = Prisma.ReportGetPayload<object>;
type PrismaReportWithSectors = Prisma.ReportGetPayload<{
  include: { sectors: true };
}>;
type PrismaSectorData = Prisma.SectorDataGetPayload<object>;

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  return value.toNumber();
}

function serializeReport(report: PrismaReport): SerializedReport {
  return {
    id: report.id,
    filename: report.filename,
    fileHash: report.file_hash,
    periodMonth: report.period_month,
    periodYear: report.period_year,
    uploadedAt: report.uploaded_at.toISOString(),
    totalRevenueGross: report.total_revenue_gross.toNumber(),
    totalRevenueNet: report.total_revenue_net.toNumber(),
    totalIva: report.total_iva.toNumber(),
    totalCost: report.total_cost.toNumber(),
    totalMargin: report.total_margin.toNumber(),
    totalMarginPct: report.total_margin_pct.toNumber(),
    totalMarkupPct: report.total_markup_pct.toNumber(),
    totalPieces: report.total_pieces,
    totalSales: report.total_sales,
  };
}

function serializeSector(sector: PrismaSectorData): SerializedSectorData {
  return {
    id: sector.id,
    reportId: sector.report_id,
    tipologia: sector.tipologia,
    valore: sector.valore.toNumber(),
    valorePct: decimalToNumber(sector.valore_pct),
    mediaPezzi: decimalToNumber(sector.media_pezzi),
    pezzi: sector.pezzi,
    pezziPct: decimalToNumber(sector.pezzi_pct),
    nVendite: sector.n_vendite,
    venditePct: decimalToNumber(sector.vendite_pct),
    costoVenduto: decimalToNumber(sector.costo_venduto),
    margine: decimalToNumber(sector.margine),
    margineTotPct: decimalToNumber(sector.margine_tot_pct),
    marginePct: decimalToNumber(sector.margine_pct),
    ricaricoPct: decimalToNumber(sector.ricarico_pct),
    pezziRicetta: sector.pezzi_ricetta,
    pezziRicettaPct: decimalToNumber(sector.pezzi_ricetta_pct),
    pezziLibera: sector.pezzi_libera,
    pezziLiberaPct: decimalToNumber(sector.pezzi_libera_pct),
    pezziFidelity: sector.pezzi_fidelity,
    pezziFidelityPct: decimalToNumber(sector.pezzi_fidelity_pct),
    valoreRicetta: decimalToNumber(sector.valore_ricetta),
    valoreRicettaPct: decimalToNumber(sector.valore_ricetta_pct),
    valoreLibera: decimalToNumber(sector.valore_libera),
    valoreLiberaPct: decimalToNumber(sector.valore_libera_pct),
    valoreFidelity: decimalToNumber(sector.valore_fidelity),
    valoreFidelityPct: decimalToNumber(sector.valore_fidelity_pct),
    imponibile: decimalToNumber(sector.imponibile),
    imponibilePct: decimalToNumber(sector.imponibile_pct),
    iva: decimalToNumber(sector.iva),
    ivaPct: decimalToNumber(sector.iva_pct),
  };
}

function serializeReportWithSectors(
  report: PrismaReportWithSectors
): ReportWithSectors {
  return {
    ...serializeReport(report),
    sectors: report.sectors.map(serializeSector),
  };
}

export async function checkDuplicateHash(hash: string): Promise<boolean> {
  const existing = await prisma.report.findUnique({
    where: { file_hash: hash },
    select: { id: true },
  });
  return existing !== null;
}

export async function checkDuplicatePeriod(
  month: number,
  year: number
): Promise<boolean> {
  const existing = await prisma.report.findUnique({
    where: {
      period_month_period_year: {
        period_month: month,
        period_year: year,
      },
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function createReport(
  parsed: ParsedReport,
  fileHash: string
): Promise<SerializedReport> {
  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        filename: parsed.filename,
        file_hash: fileHash,
        period_month: parsed.period.month,
        period_year: parsed.period.year,
        total_revenue_gross: parsed.totals.totalRevenueGross,
        total_revenue_net: parsed.totals.totalRevenueNet,
        total_iva: parsed.totals.totalIva,
        total_cost: parsed.totals.totalCost,
        total_margin: parsed.totals.totalMargin,
        total_margin_pct: parsed.totals.totalMarginPct,
        total_markup_pct: parsed.totals.totalMarkupPct,
        total_pieces: parsed.totals.totalPieces,
        total_sales: parsed.totals.totalSales,
        sectors: {
          create: parsed.sectors.map((s) => ({
            tipologia: s.tipologia,
            valore: s.valore,
            valore_pct: s.valorePct,
            media_pezzi: s.mediaPezzi,
            pezzi: s.pezzi,
            pezzi_pct: s.pezziPct,
            n_vendite: s.nVendite,
            vendite_pct: s.venditePct,
            costo_venduto: s.costoVenduto,
            margine: s.margine,
            margine_tot_pct: s.margineTotPct,
            margine_pct: s.marginePct,
            ricarico_pct: s.ricaricoPct,
            pezzi_ricetta: s.pezziRicetta,
            pezzi_ricetta_pct: s.pezziRicettaPct,
            pezzi_libera: s.pezziLibera,
            pezzi_libera_pct: s.pezziLiberaPct,
            pezzi_fidelity: s.pezziFidelity,
            pezzi_fidelity_pct: s.pezziFidelityPct,
            valore_ricetta: s.valoreRicetta,
            valore_ricetta_pct: s.valoreRicettaPct,
            valore_libera: s.valoreLibera,
            valore_libera_pct: s.valoreLiberaPct,
            valore_fidelity: s.valoreFidelity,
            valore_fidelity_pct: s.valoreFidelityPct,
            imponibile: s.imponibile,
            imponibile_pct: s.imponibilePct,
            iva: s.iva,
            iva_pct: s.ivaPct,
          })),
        },
      },
    });

    return report;
  });

  return serializeReport(result);
}

export async function getAll(): Promise<SerializedReport[]> {
  const reports = await prisma.report.findMany({
    orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
  });
  return reports.map(serializeReport);
}

export async function getById(
  id: string
): Promise<ReportWithSectors | null> {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      sectors: { orderBy: { valore: "desc" } },
    },
  });
  if (!report) return null;
  return serializeReportWithSectors(report);
}

export async function getLatest(): Promise<ReportWithSectors | null> {
  const report = await prisma.report.findFirst({
    orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
    include: {
      sectors: { orderBy: { valore: "desc" } },
    },
  });
  if (!report) return null;
  return serializeReportWithSectors(report);
}

export async function deleteById(id: string): Promise<boolean> {
  try {
    await prisma.report.delete({ where: { id } });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
}
