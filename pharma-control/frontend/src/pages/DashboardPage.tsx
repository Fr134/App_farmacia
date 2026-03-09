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
  ChevronDown,
  Download,
} from "lucide-react";
import { getReport, getLatestReport, getAggregateReport, getExpenseSummary, getQuarterlyVat, getBudgets } from "@/services/api";
import { exportDashboardPdf } from "@/lib/exportPdf";
import { useAlerts } from "@/hooks/useAlerts";
import { MESI_DISPLAY, MESI_SHORT, COLORS } from "@/lib/constants";
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
import RevenueTreemap from "@/components/dashboard/RevenueTreemap";
import MarginBySectorChart from "@/components/dashboard/MarginBySectorChart";
import MarginWaterfall from "@/components/dashboard/MarginWaterfall";
import SectorList from "@/components/dashboard/SectorList";
import ChannelBreakdown from "@/components/dashboard/ChannelBreakdown";
import VATAnalysis from "@/components/dashboard/VATAnalysis";
import ComparisonSummary from "@/components/dashboard/ComparisonSummary";
import DetailTable from "@/components/dashboard/DetailTable";
import KPICardSkeleton from "@/components/ui/KPICardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import type { ReportWithSectors, QuarterlyVatData, BudgetSummary } from "@/types";

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
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);
  const [expenseVatMonthly, setExpenseVatMonthly] = useState<number | null>(null);
  const [quarterlyVat, setQuarterlyVat] = useState<QuarterlyVatData | null>(null);
  const [distView, setDistView] = useState<"donut" | "treemap">("donut");
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<{ summary: BudgetSummary; year: number; name: string } | null>(null);

  // Alerts (hooks must be called before any early return)
  const isRangeMode = filterState.mode === "range";
  const alertReportId = !isRangeMode && report ? report.id : null;
  const alertCompareId = filterState.mode === "compare" && compReport ? compReport.id : null;
  const { alerts, summary: alertSummary, loading: alertsLoading } = useAlerts(
    alertReportId,
    alertCompareId
  );

  // Refs
  const sectorListRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  function handleAlertSectorClick(sector: string) {
    sectorListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightedSector(sector);
    setTimeout(() => setHighlightedSector(null), 3000);
  }

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
    setExpenseVatMonthly(null);
    setQuarterlyVat(null);

    try {
      if (filterState.mode === "single") {
        const data = filterState.currentId
          ? await getReport(filterState.currentId)
          : await getLatestReport();
        setReport(data);

        // Fetch IVA trimestrale data in parallel
        const [expSummary, qVat] = await Promise.all([
          getExpenseSummary().catch(() => null),
          getQuarterlyVat(data.periodMonth, data.periodYear).catch(() => null),
        ]);
        setExpenseVatMonthly(expSummary?.deductibleVatMonthly ?? null);
        setQuarterlyVat(qVat);
      } else if (filterState.mode === "compare") {
        const currentData = filterState.currentId
          ? await getReport(filterState.currentId)
          : await getLatestReport();
        setReport(currentData);

        const fetchPromises: Promise<unknown>[] = [];

        if (filterState.comparisonId) {
          fetchPromises.push(
            getReport(filterState.comparisonId).then((d) => setCompReport(d))
          );
        }

        // Fetch IVA trimestrale data
        fetchPromises.push(
          getExpenseSummary()
            .then((s) => setExpenseVatMonthly(s.deductibleVatMonthly))
            .catch(() => null)
        );
        fetchPromises.push(
          getQuarterlyVat(currentData.periodMonth, currentData.periodYear)
            .then((d) => setQuarterlyVat(d))
            .catch(() => null)
        );

        await Promise.all(fetchPromises);
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

  // Fetch budget for the viewed year
  useEffect(() => {
    if (!report) {
      setBudgetSummary(null);
      return;
    }
    const reportYear = report.periodYear;
    getBudgets()
      .then((data) => {
        const budgets = data.budgets;
        // Prefer CONFIRMED budget for this year, then DRAFT, then next year
        const match =
          budgets.find((b) => b.year === reportYear && b.status === "CONFIRMED") ??
          budgets.find((b) => b.year === reportYear) ??
          budgets.find((b) => b.year === reportYear + 1 && b.status === "CONFIRMED") ??
          budgets.find((b) => b.year === reportYear + 1);
        if (match) {
          setBudgetSummary({ summary: match.summary, year: match.year, name: match.name });
        } else {
          setBudgetSummary(null);
        }
      })
      .catch(() => setBudgetSummary(null));
  }, [report?.periodYear, report?.id]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-blue animate-pulse" />
          <div className="h-5 w-56 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-5">
            <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse mb-4" />
            <ChartSkeleton />
          </div>
          <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-5">
            <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse mb-4" />
            <ChartSkeleton height={200} />
          </div>
        </div>
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

  // Derived values
  const r = report;
  const comp = filterState.mode === "compare" ? compReport : null;

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

  // Budget targets — monthly portion of annual budget
  const numMonths = isRangeMode && r.aggregatedPeriods ? r.aggregatedPeriods : 1;
  function budgetTarget(annualValue: number, actual: number) {
    if (!budgetSummary) return undefined;
    const target = (annualValue / 12) * numMonths;
    const pct = target > 0 ? (actual / target) * 100 : 0;
    return {
      label: `Budget ${budgetSummary.year}`,
      targetValue: formatCurrency(target),
      achievementPct: Math.round(pct * 10) / 10,
    };
  }
  function budgetTargetPct(budgetPct: number, actualPct: number) {
    if (!budgetSummary) return undefined;
    const pct = budgetPct > 0 ? (actualPct / budgetPct) * 100 : 0;
    return {
      label: `Budget ${budgetSummary.year}`,
      targetValue: formatPercent(budgetPct),
      achievementPct: Math.round(pct * 10) / 10,
    };
  }

  // Build title + subtitle
  let title: string;
  let subtitle: string | null = null;
  if (isRangeMode && filterState.rangeFrom && filterState.rangeTo) {
    // Parse YYYY-MM to short display
    const parseYM = (ym: string) => {
      const [y, m] = ym.split("-").map(Number);
      return `${MESI_SHORT[m] ?? m} ${y}`;
    };
    const parseYMFull = (ym: string) => {
      const [y, m] = ym.split("-").map(Number);
      return `${MESI_DISPLAY[m] ?? m} ${y}`;
    };
    title = `Dashboard Vendite \u2014 ${parseYM(filterState.rangeFrom)} \u2013 ${parseYM(filterState.rangeTo)}`;
    const count = r.aggregatedPeriods ?? 0;
    if (count > 0) {
      subtitle = `Dati aggregati: ${parseYMFull(filterState.rangeFrom)} \u2014 ${parseYMFull(filterState.rangeTo)} (${count} ${count === 1 ? "mese" : "mesi"})`;
    }
  } else {
    title = `Dashboard Vendite \u2014 ${monthName} ${r.periodYear}`;
  }

  async function handleExportPdf() {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      await exportDashboardPdf(dashboardRef.current, title);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div ref={dashboardRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-accent-green" />
            <h1 className="text-lg font-semibold text-text-primary">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-1 ml-[22px] text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-btn bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-white/[0.08] hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Esporta PDF
          </button>
          <PeriodFilter state={filterState} onChange={handleFilterChange} />
        </div>
      </div>

      {/* Comparison Summary */}
      {comp && (
        <ComparisonSummary current={r} comparison={comp} />
      )}

      {/* Alert Panel */}
      {!isRangeMode && (
        <AlertPanel
          alerts={alerts}
          summary={alertSummary}
          loading={alertsLoading}
          onSectorClick={handleAlertSectorClick}
        />
      )}

      {/* Row 1: 4 KPI Cards */}
      <div data-pdf-section="kpi-row-1" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICardWithDelta
          label="Transato Lordo"
          value={formatCurrency(r.totalRevenueGross)}
          rawValue={r.totalRevenueGross}
          formatFn={formatCurrency}
          subtitle="IVA inclusa"
          icon={Banknote}
          accentColor={COLORS.accentBlue}
          delta={comp ? pctChange(r.totalRevenueGross, comp.totalRevenueGross) : null}
          previousValue={comp ? formatCurrency(comp.totalRevenueGross) : null}
          budgetTarget={budgetSummary ? budgetTarget(budgetSummary.summary.totalForecastRevenue, r.totalRevenueGross) : null}
        />
        <KPICardWithDelta
          label="Fatturato Netto"
          value={formatCurrency(r.totalRevenueNet)}
          rawValue={r.totalRevenueNet}
          formatFn={formatCurrency}
          subtitle={`di cui IVA ${formatCurrency(r.totalIva)}`}
          icon={FileText}
          accentColor={COLORS.accentCyan}
          delta={comp ? pctChange(r.totalRevenueNet, comp.totalRevenueNet) : null}
          previousValue={comp ? formatCurrency(comp.totalRevenueNet) : null}
        />
        <KPICardWithDelta
          label="Venduto"
          value={formatCurrency(r.totalRevenueGross)}
          rawValue={r.totalRevenueGross}
          formatFn={formatCurrency}
          subtitle={`${formatInteger(r.totalPieces)} pezzi \u00B7 ${formatInteger(r.totalSales)} vendite`}
          icon={ShoppingBag}
          accentColor={COLORS.accentGreen}
          delta={comp ? pctChange(r.totalPieces, comp.totalPieces) : null}
          previousValue={comp ? `${formatInteger(comp.totalPieces)} pezzi` : null}
          budgetTarget={budgetSummary ? budgetTarget(budgetSummary.summary.totalForecastRevenue, r.totalRevenueGross) : null}
        />
        <KPICardWithDelta
          label="Costo del Venduto"
          value={formatCurrency(r.totalCost)}
          rawValue={r.totalCost}
          formatFn={formatCurrency}
          subtitle={`${formatPercent(costPct)} del transato`}
          icon={Wallet}
          accentColor={COLORS.accentAmber}
          delta={comp ? pctChange(r.totalCost, comp.totalCost) : null}
          previousValue={comp ? formatCurrency(comp.totalCost) : null}
          budgetTarget={budgetSummary ? budgetTarget(budgetSummary.summary.totalForecastCOGS, r.totalCost) : null}
        />
      </div>

      {/* Row 2: 3 KPI Cards */}
      <div data-pdf-section="kpi-row-2" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICardWithDelta
          label="Margine Lordo"
          value={formatCurrency(r.totalMargin)}
          rawValue={r.totalMargin}
          formatFn={formatCurrency}
          subtitle={`${formatPercent(r.totalMarginPct)} sul venduto`}
          icon={TrendingUp}
          accentColor={COLORS.accentGreen}
          delta={comp ? pctChange(r.totalMargin, comp.totalMargin) : null}
          previousValue={comp ? formatCurrency(comp.totalMargin) : null}
          budgetTarget={budgetSummary ? budgetTarget(budgetSummary.summary.totalForecastMargin, r.totalMargin) : null}
        />
        <KPICardWithDelta
          label="Margine %"
          value={formatPercent(r.totalMarginPct)}
          rawValue={r.totalMarginPct}
          formatFn={formatPercent}
          subtitle={`Ricarico ${formatPercent(r.totalMarkupPct)}`}
          icon={Percent}
          accentColor={COLORS.accentPurple}
          delta={comp ? r.totalMarginPct - comp.totalMarginPct : null}
          previousValue={comp ? formatPercent(comp.totalMarginPct) : null}
          budgetTarget={budgetSummary ? budgetTargetPct(budgetSummary.summary.forecastMarginPct, r.totalMarginPct) : null}
        />
        <KPICardWithDelta
          label="Scontrino Medio"
          value={formatCurrency(avgTicket)}
          rawValue={avgTicket}
          formatFn={formatCurrency}
          subtitle={`${piecesPerSale.toFixed(1).replace(".", ",")} pezzi/vendita`}
          icon={CreditCard}
          accentColor={COLORS.accentBlue}
          delta={comp && compAvgTicket ? pctChange(avgTicket, compAvgTicket) : null}
          previousValue={compAvgTicket ? formatCurrency(compAvgTicket) : null}
        />
      </div>

      {/* Charts Row */}
      <div data-pdf-section="charts" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top 5 &middot; Costo vs Margine">
          <Top5CostMarginChart
            sectors={r.sectors}
            comparisonSectors={comp?.sectors}
          />
        </SectionCard>
        <SectionCard
          title="Distribuzione Venduto/Margine"
          rightAction={
            <div className="flex gap-1 rounded-btn bg-white/[0.03] p-1">
              {(["donut", "treemap"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setDistView(v)}
                  className={`rounded-[6px] px-3 py-1 text-xs font-medium transition-colors ${
                    distView === v
                      ? "bg-accent-blue text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {v === "donut" ? "Donut" : "Treemap"}
                </button>
              ))}
            </div>
          }
        >
          {distView === "donut" ? (
            <DistributionChart
              sectors={r.sectors}
              comparisonSectors={comp?.sectors}
            />
          ) : (
            <RevenueTreemap sectors={r.sectors} />
          )}
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

      {/* Margin Waterfall */}
      <SectionCard title="Costruzione Margine" subtitle="Contributo di ogni settore al margine totale">
        <MarginWaterfall sectors={r.sectors} />
      </SectionCard>

      {/* VAT Analysis */}
      <SectionCard title="Analisi IVA" subtitle="Dettaglio imponibile e imposta sul valore aggiunto">
        <VATAnalysis
          sectors={r.sectors}
          quarterlyVat={quarterlyVat}
          expenseVatMonthly={expenseVatMonthly}
        />
      </SectionCard>

      {/* Detail Table — collapsible */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary overflow-hidden">
        <button
          onClick={() => setDetailOpen(!detailOpen)}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Tabella Dettagliata
            </h3>
            <p className="mt-0.5 text-[12px] text-text-dim">
              Tutti i settori con tutte le metriche &middot; Clicca sulle colonne per ordinare
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-text-dim transition-transform ${
              detailOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {detailOpen && (
          <div className="px-5 pb-5">
            <DetailTable sectors={r.sectors} />
          </div>
        )}
      </div>

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
