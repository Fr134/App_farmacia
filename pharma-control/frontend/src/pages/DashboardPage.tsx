import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Banknote,
  FileText,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Percent,
  CreditCard,
  Upload,
  Loader2,
} from "lucide-react";
import { getReport, getLatestReport, getAggregateReport } from "@/services/api";
import { useAlerts } from "@/hooks/useAlerts";
import { MESI_DISPLAY, COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatPercent,
  formatInteger,
  pctChange,
} from "@/lib/formatters";
import KPICardWithDelta from "@/components/dashboard/KPICardWithDelta";
import SectionCard from "@/components/ui/SectionCard";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import type { FilterMode, PeriodFilterState } from "@/components/dashboard/PeriodFilter";
import AlertPanel from "@/components/dashboard/AlertPanel";
import Top5CostMarginChart from "@/components/dashboard/Top5CostMarginChart";
import DistributionChart from "@/components/dashboard/DistributionChart";
import MarginBySectorChart from "@/components/dashboard/MarginBySectorChart";
import SectorList from "@/components/dashboard/SectorList";
import ChannelBreakdown from "@/components/dashboard/ChannelBreakdown";
import VATAnalysis from "@/components/dashboard/VATAnalysis";
import ComparisonSummary from "@/components/dashboard/ComparisonSummary";
import type { ReportWithSectors } from "@/types";

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state from URL params
  const urlMode = (searchParams.get("mode") ?? "single") as FilterMode;
  const urlCurrent = searchParams.get("current");
  const urlPrevious = searchParams.get("previous");
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  const [filterState, setFilterState] = useState<PeriodFilterState>({
    mode: urlMode,
    currentId: urlCurrent,
    comparisonId: urlPrevious,
    rangeFrom: urlFrom,
    rangeTo: urlTo,
  });

  // Report state
  const [report, setReport] = useState<ReportWithSectors | null>(null);
  const [compReport, setCompReport] = useState<ReportWithSectors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  // Sync filter changes to URL params
  function handleFilterChange(newState: PeriodFilterState) {
    setFilterState(newState);

    const params: Record<string, string> = { mode: newState.mode };
    if (newState.mode === "single" && newState.currentId) {
      params.current = newState.currentId;
    } else if (newState.mode === "compare") {
      if (newState.currentId) params.current = newState.currentId;
      if (newState.comparisonId) params.previous = newState.comparisonId;
    } else if (newState.mode === "range") {
      if (newState.rangeFrom) params.from = newState.rangeFrom;
      if (newState.rangeTo) params.to = newState.rangeTo;
    }
    setSearchParams(params, { replace: true });
  }

  // Fetch data based on filter state
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEmpty(false);
    setCompReport(null);

    try {
      if (filterState.mode === "single") {
        const data = filterState.currentId
          ? await getReport(filterState.currentId)
          : await getLatestReport();
        setReport(data);
      } else if (filterState.mode === "compare") {
        const currentData = filterState.currentId
          ? await getReport(filterState.currentId)
          : await getLatestReport();
        setReport(currentData);

        if (filterState.comparisonId) {
          const prevData = await getReport(filterState.comparisonId);
          setCompReport(prevData);
        }
      } else if (filterState.mode === "range") {
        if (filterState.rangeFrom && filterState.rangeTo) {
          const data = await getAggregateReport(filterState.rangeFrom, filterState.rangeTo);
          setReport(data);
        } else {
          const data = await getLatestReport();
          setReport(data);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto";
      if (message.includes("Nessun report") || message.includes("non trovato")) {
        setEmpty(true);
        setReport(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [filterState.mode, filterState.currentId, filterState.comparisonId, filterState.rangeFrom, filterState.rangeTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-accent-red">{error}</p>
      </div>
    );
  }

  // Empty state
  if (empty || !report) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Upload className="h-12 w-12 text-text-dim" />
        <p className="text-sm text-text-muted">
          Nessun report caricato.
        </p>
        <Link
          to="/upload"
          className="rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
        >
          Carica un CSV
        </Link>
      </div>
    );
  }

  // Alerts
  const isRangeMode = filterState.mode === "range";
  const alertReportId = !isRangeMode && report ? report.id : null;
  const alertCompareId = filterState.mode === "compare" && compReport ? compReport.id : null;
  const { alerts, summary: alertSummary, loading: alertsLoading } = useAlerts(
    alertReportId,
    alertCompareId
  );

  // Sector list ref for scroll-to
  const sectorListRef = useRef<HTMLDivElement>(null);

  function handleAlertSectorClick(sector: string) {
    sectorListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // The SectorList will be highlighted via the highlightedSector prop
    setHighlightedSector(sector);
    setTimeout(() => setHighlightedSector(null), 3000);
  }
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);

  // Derived values
  const r = report;
  const comp = filterState.mode === "compare" ? compReport : null;
  const isRange = filterState.mode === "range";

  const monthName = MESI_DISPLAY[r.periodMonth] ?? `${r.periodMonth}`;
  const costPct =
    r.totalRevenueGross > 0
      ? (r.totalCost / r.totalRevenueGross) * 100
      : 0;
  const avgTicket =
    r.totalSales > 0 ? r.totalRevenueGross / r.totalSales : 0;
  const piecesPerSale =
    r.totalSales > 0 ? r.totalPieces / r.totalSales : 0;

  // Comparison deltas
  const compAvgTicket = comp && comp.totalSales > 0 ? comp.totalRevenueGross / comp.totalSales : null;

  // Build title
  let title: string;
  if (isRange && filterState.rangeFrom && filterState.rangeTo) {
    title = `Dashboard Vendite — ${filterState.rangeFrom} \u2192 ${filterState.rangeTo}`;
  } else {
    title = `Dashboard Vendite — ${monthName} ${r.periodYear}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-green" />
          <h1 className="text-lg font-semibold text-text-primary">
            {title}
          </h1>
        </div>
        <PeriodFilter state={filterState} onChange={handleFilterChange} />
      </div>

      {/* Comparison Summary */}
      {comp && (
        <ComparisonSummary current={r} comparison={comp} />
      )}

      {/* Alert Panel */}
      {!isRange && (
        <AlertPanel
          alerts={alerts}
          summary={alertSummary}
          loading={alertsLoading}
          onSectorClick={handleAlertSectorClick}
        />
      )}

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICardWithDelta
          label="Transato Lordo"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle="IVA inclusa"
          icon={Banknote}
          accentColor={COLORS.accentBlue}
          delta={comp ? pctChange(r.totalRevenueGross, comp.totalRevenueGross) : null}
          previousValue={comp ? formatCurrency(comp.totalRevenueGross) : null}
        />
        <KPICardWithDelta
          label="Fatturato Netto"
          value={formatCurrency(r.totalRevenueNet)}
          subtitle={`di cui IVA ${formatCurrency(r.totalIva)}`}
          icon={FileText}
          accentColor={COLORS.accentCyan}
          delta={comp ? pctChange(r.totalRevenueNet, comp.totalRevenueNet) : null}
          previousValue={comp ? formatCurrency(comp.totalRevenueNet) : null}
        />
        <KPICardWithDelta
          label="Venduto"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle={`${formatInteger(r.totalPieces)} pezzi \u00B7 ${formatInteger(r.totalSales)} vendite`}
          icon={ShoppingBag}
          accentColor={COLORS.accentGreen}
          delta={comp ? pctChange(r.totalPieces, comp.totalPieces) : null}
          previousValue={comp ? `${formatInteger(comp.totalPieces)} pezzi` : null}
        />
        <KPICardWithDelta
          label="Costo del Venduto"
          value={formatCurrency(r.totalCost)}
          subtitle={`${formatPercent(costPct)} del transato`}
          icon={Wallet}
          accentColor={COLORS.accentAmber}
          delta={comp ? pctChange(r.totalCost, comp.totalCost) : null}
          previousValue={comp ? formatCurrency(comp.totalCost) : null}
        />
      </div>

      {/* Row 2: 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICardWithDelta
          label="Margine Lordo"
          value={formatCurrency(r.totalMargin)}
          subtitle={`${formatPercent(r.totalMarginPct)} sul venduto`}
          icon={TrendingUp}
          accentColor={COLORS.accentGreen}
          delta={comp ? pctChange(r.totalMargin, comp.totalMargin) : null}
          previousValue={comp ? formatCurrency(comp.totalMargin) : null}
        />
        <KPICardWithDelta
          label="Margine %"
          value={formatPercent(r.totalMarginPct)}
          subtitle={`Ricarico ${formatPercent(r.totalMarkupPct)}`}
          icon={Percent}
          accentColor={COLORS.accentPurple}
          delta={comp ? r.totalMarginPct - comp.totalMarginPct : null}
          previousValue={comp ? formatPercent(comp.totalMarginPct) : null}
        />
        <KPICardWithDelta
          label="Scontrino Medio"
          value={formatCurrency(avgTicket)}
          subtitle={`${piecesPerSale.toFixed(1).replace(".", ",")} pezzi/vendita`}
          icon={CreditCard}
          accentColor={COLORS.accentBlue}
          delta={comp && compAvgTicket ? pctChange(avgTicket, compAvgTicket) : null}
          previousValue={compAvgTicket ? formatCurrency(compAvgTicket) : null}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top 5 &middot; Costo vs Margine">
          <Top5CostMarginChart
            sectors={r.sectors}
            comparisonSectors={comp?.sectors}
          />
        </SectionCard>
        <SectionCard title="Distribuzione Venduto/Margine">
          <DistributionChart
            sectors={r.sectors}
            comparisonSectors={comp?.sectors}
          />
        </SectionCard>
      </div>

      {/* Full-width Margin Chart */}
      <SectionCard title="Margine % per Settore">
        <MarginBySectorChart
          sectors={r.sectors}
          comparisonSectors={comp?.sectors}
        />
      </SectionCard>

      {/* Channel Breakdown */}
      <SectionCard title="Canali di Vendita" subtitle="Ripartizione ricavi per canale di vendita">
        <ChannelBreakdown sectors={r.sectors} />
      </SectionCard>

      {/* VAT Analysis */}
      <SectionCard title="Analisi IVA" subtitle="Dettaglio imponibile e imposta sul valore aggiunto">
        <VATAnalysis sectors={r.sectors} />
      </SectionCard>

      {/* Sector List */}
      <div ref={sectorListRef}>
        <SectionCard title="Tutti i Settori" subtitle={`${r.sectors.length} categorie`}>
          <SectorList sectors={r.sectors} highlightedSector={highlightedSector} />
        </SectionCard>
      </div>

      {/* Footer */}
      <p className="pb-4 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim">
        Pharma Control &middot; Powered by DottHouse.ai
      </p>
    </div>
  );
}
