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

export async function getAggregate(
  fromMonth: number,
  fromYear: number,
  toMonth: number,
  toYear: number
): Promise<ReportWithSectors | null> {
  // Fetch all reports in the date range
  const reports = await prisma.report.findMany({
    where: {
      OR: buildDateRangeFilter(fromMonth, fromYear, toMonth, toYear),
    },
    include: {
      sectors: true,
    },
    orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
  });

  if (reports.length === 0) return null;

  // Aggregate totals
  let totalRevenueGross = 0;
  let totalRevenueNet = 0;
  let totalIva = 0;
  let totalCost = 0;
  let totalMargin = 0;
  let totalPieces = 0;
  let totalSales = 0;

  for (const r of reports) {
    totalRevenueGross += r.total_revenue_gross.toNumber();
    totalRevenueNet += r.total_revenue_net.toNumber();
    totalIva += r.total_iva.toNumber();
    totalCost += r.total_cost.toNumber();
    totalMargin += r.total_margin.toNumber();
    totalPieces += r.total_pieces;
    totalSales += r.total_sales;
  }

  const totalMarginPct = totalRevenueGross > 0 ? (totalMargin / totalRevenueGross) * 100 : 0;
  const totalMarkupPct = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

  // Aggregate sectors by tipologia
  const sectorMap = new Map<string, SerializedSectorData>();

  for (const r of reports) {
    for (const s of r.sectors) {
      const existing = sectorMap.get(s.tipologia);
      if (existing) {
        existing.valore += s.valore.toNumber();
        existing.pezzi += s.pezzi;
        existing.nVendite += s.n_vendite;
        existing.costoVenduto = (existing.costoVenduto ?? 0) + (decimalToNumber(s.costo_venduto) ?? 0);
        existing.margine = (existing.margine ?? 0) + (decimalToNumber(s.margine) ?? 0);
        existing.pezziRicetta = (existing.pezziRicetta ?? 0) + (s.pezzi_ricetta ?? 0);
        existing.pezziLibera = (existing.pezziLibera ?? 0) + (s.pezzi_libera ?? 0);
        existing.pezziFidelity = (existing.pezziFidelity ?? 0) + (s.pezzi_fidelity ?? 0);
        existing.valoreRicetta = (existing.valoreRicetta ?? 0) + (decimalToNumber(s.valore_ricetta) ?? 0);
        existing.valoreLibera = (existing.valoreLibera ?? 0) + (decimalToNumber(s.valore_libera) ?? 0);
        existing.valoreFidelity = (existing.valoreFidelity ?? 0) + (decimalToNumber(s.valore_fidelity) ?? 0);
        existing.imponibile = (existing.imponibile ?? 0) + (decimalToNumber(s.imponibile) ?? 0);
        existing.iva = (existing.iva ?? 0) + (decimalToNumber(s.iva) ?? 0);
      } else {
        sectorMap.set(s.tipologia, {
          id: s.id,
          reportId: s.report_id,
          tipologia: s.tipologia,
          valore: s.valore.toNumber(),
          valorePct: null,
          mediaPezzi: decimalToNumber(s.media_pezzi),
          pezzi: s.pezzi,
          pezziPct: null,
          nVendite: s.n_vendite,
          venditePct: null,
          costoVenduto: decimalToNumber(s.costo_venduto),
          margine: decimalToNumber(s.margine),
          margineTotPct: null,
          marginePct: null,
          ricaricoPct: null,
          pezziRicetta: s.pezzi_ricetta,
          pezziRicettaPct: null,
          pezziLibera: s.pezzi_libera,
          pezziLiberaPct: null,
          pezziFidelity: s.pezzi_fidelity,
          pezziFidelityPct: null,
          valoreRicetta: decimalToNumber(s.valore_ricetta),
          valoreRicettaPct: null,
          valoreLibera: decimalToNumber(s.valore_libera),
          valoreLiberaPct: null,
          valoreFidelity: decimalToNumber(s.valore_fidelity),
          valoreFidelityPct: null,
          imponibile: decimalToNumber(s.imponibile),
          imponibilePct: null,
          iva: decimalToNumber(s.iva),
          ivaPct: null,
        });
      }
    }
  }

  // Recompute percentages for aggregated sectors
  const sectors = Array.from(sectorMap.values());
  for (const s of sectors) {
    s.valorePct = totalRevenueGross > 0 ? (s.valore / totalRevenueGross) * 100 : null;
    s.pezziPct = totalPieces > 0 ? (s.pezzi / totalPieces) * 100 : null;
    s.venditePct = totalSales > 0 ? (s.nVendite / totalSales) * 100 : null;
    s.marginePct = s.valore > 0 && s.margine !== null ? (s.margine / s.valore) * 100 : null;
    s.ricaricoPct = s.costoVenduto && s.costoVenduto > 0 && s.margine !== null ? (s.margine / s.costoVenduto) * 100 : null;
    s.margineTotPct = totalMargin > 0 && s.margine !== null ? (s.margine / totalMargin) * 100 : null;
    s.mediaPezzi = s.nVendite > 0 ? s.pezzi / s.nVendite : null;

    const sPezziTotal = (s.pezziRicetta ?? 0) + (s.pezziLibera ?? 0) + (s.pezziFidelity ?? 0);
    s.pezziRicettaPct = sPezziTotal > 0 ? ((s.pezziRicetta ?? 0) / sPezziTotal) * 100 : null;
    s.pezziLiberaPct = sPezziTotal > 0 ? ((s.pezziLibera ?? 0) / sPezziTotal) * 100 : null;
    s.pezziFidelityPct = sPezziTotal > 0 ? ((s.pezziFidelity ?? 0) / sPezziTotal) * 100 : null;

    const sValTotal = (s.valoreRicetta ?? 0) + (s.valoreLibera ?? 0) + (s.valoreFidelity ?? 0);
    s.valoreRicettaPct = sValTotal > 0 ? ((s.valoreRicetta ?? 0) / sValTotal) * 100 : null;
    s.valoreLiberaPct = sValTotal > 0 ? ((s.valoreLibera ?? 0) / sValTotal) * 100 : null;
    s.valoreFidelityPct = sValTotal > 0 ? ((s.valoreFidelity ?? 0) / sValTotal) * 100 : null;

    const sNetTotal = (s.imponibile ?? 0) + (s.iva ?? 0);
    s.imponibilePct = sNetTotal > 0 ? ((s.imponibile ?? 0) / sNetTotal) * 100 : null;
    s.ivaPct = sNetTotal > 0 ? ((s.iva ?? 0) / sNetTotal) * 100 : null;
  }

  // Sort by valore descending
  sectors.sort((a, b) => b.valore - a.valore);

  // Use the latest report for metadata
  const latest = reports[0];

  return {
    id: `aggregate-${fromYear}${String(fromMonth).padStart(2, "0")}-${toYear}${String(toMonth).padStart(2, "0")}`,
    filename: `Aggregato ${reports.length} report`,
    fileHash: "",
    periodMonth: latest.period_month,
    periodYear: latest.period_year,
    uploadedAt: latest.uploaded_at.toISOString(),
    totalRevenueGross,
    totalRevenueNet,
    totalIva,
    totalCost,
    totalMargin,
    totalMarginPct,
    totalMarkupPct,
    totalPieces,
    totalSales,
    sectors,
  };
}

function buildDateRangeFilter(
  fromMonth: number,
  fromYear: number,
  toMonth: number,
  toYear: number
): Array<{ period_year: number; period_month?: { gte?: number; lte?: number } }> {
  if (fromYear === toYear) {
    return [
      {
        period_year: fromYear,
        period_month: { gte: fromMonth, lte: toMonth },
      },
    ];
  }

  const conditions: Array<{ period_year: number; period_month?: { gte?: number; lte?: number } }> = [];

  // First year: fromMonth to December
  conditions.push({
    period_year: fromYear,
    period_month: { gte: fromMonth },
  });

  // Middle years: all months
  for (let y = fromYear + 1; y < toYear; y++) {
    conditions.push({ period_year: y });
  }

  // Last year: January to toMonth
  conditions.push({
    period_year: toYear,
    period_month: { lte: toMonth },
  });

  return conditions;
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
