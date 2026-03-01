import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useReport } from "@/hooks/useReport";
import { MESI_DISPLAY, COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatPercent,
  formatInteger,
  pctChange,
} from "@/lib/formatters";
import KPICard from "@/components/ui/KPICard";
import SectionCard from "@/components/ui/SectionCard";
import PeriodSelector from "@/components/dashboard/PeriodSelector";
import Top5CostMarginChart from "@/components/dashboard/Top5CostMarginChart";
import DistributionChart from "@/components/dashboard/DistributionChart";
import MarginBySectorChart from "@/components/dashboard/MarginBySectorChart";
import SectorList from "@/components/dashboard/SectorList";
import ComparisonSummary from "@/components/dashboard/ComparisonSummary";

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const { report, loading, error, empty } = useReport(selectedId);
  const {
    report: compReport,
    loading: compLoading,
  } = useReport(comparisonId);

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

  // Derived values
  const r = report;
  const comp = comparisonId && !compLoading ? compReport : null;
  const monthName = MESI_DISPLAY[r.periodMonth] ?? `${r.periodMonth}`;
  const costPct =
    r.totalRevenueGross > 0
      ? (r.totalCost / r.totalRevenueGross) * 100
      : 0;
  const avgTicket =
    r.totalSales > 0 ? r.totalRevenueGross / r.totalSales : 0;
  const piecesPerSale =
    r.totalSales > 0 ? r.totalPieces / r.totalSales : 0;

  // Comparison % changes (null when no comparison)
  const chgRevenueGross = comp ? pctChange(r.totalRevenueGross, comp.totalRevenueGross) : null;
  const chgRevenueNet = comp ? pctChange(r.totalRevenueNet, comp.totalRevenueNet) : null;
  const chgPieces = comp ? pctChange(r.totalPieces, comp.totalPieces) : null;
  const chgCost = comp ? pctChange(r.totalCost, comp.totalCost) : null;
  const chgMargin = comp ? pctChange(r.totalMargin, comp.totalMargin) : null;
  const chgMarginPct = comp ? r.totalMarginPct - comp.totalMarginPct : null;
  const compAvgTicket = comp && comp.totalSales > 0 ? comp.totalRevenueGross / comp.totalSales : null;
  const chgAvgTicket = comp && compAvgTicket ? pctChange(avgTicket, compAvgTicket) : null;

  // Current report ID for excludeId
  const currentReportId = r.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-green" />
          <h1 className="text-lg font-semibold text-text-primary">
            Dashboard Vendite — {monthName} {r.periodYear}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector
            currentMonth={r.periodMonth}
            currentYear={r.periodYear}
            onSelect={setSelectedId}
          />
          <span className="text-xs text-text-dim">vs</span>
          <PeriodSelector
            currentMonth={0}
            currentYear={0}
            onSelect={(id) => setComparisonId(id || null)}
            excludeId={currentReportId}
            placeholder="Nessun confronto"
          />
        </div>
      </div>

      {/* Comparison Summary */}
      {comp && (
        <ComparisonSummary current={r} comparison={comp} />
      )}

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Transato Lordo"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle="IVA inclusa"
          icon={Banknote}
          accentColor={COLORS.accentBlue}
          change={chgRevenueGross}
        />
        <KPICard
          label="Fatturato Netto"
          value={formatCurrency(r.totalRevenueNet)}
          subtitle={`di cui IVA ${formatCurrency(r.totalIva)}`}
          icon={FileText}
          accentColor={COLORS.accentCyan}
          change={chgRevenueNet}
        />
        <KPICard
          label="Venduto"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle={`${formatInteger(r.totalPieces)} pezzi \u00B7 ${formatInteger(r.totalSales)} vendite`}
          icon={ShoppingBag}
          accentColor={COLORS.accentGreen}
          change={chgPieces}
        />
        <KPICard
          label="Costo del Venduto"
          value={formatCurrency(r.totalCost)}
          subtitle={`${formatPercent(costPct)} del transato`}
          icon={Wallet}
          accentColor={COLORS.accentAmber}
          change={chgCost}
        />
      </div>

      {/* Row 2: 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Margine Lordo"
          value={formatCurrency(r.totalMargin)}
          subtitle={`${formatPercent(r.totalMarginPct)} sul venduto`}
          icon={TrendingUp}
          accentColor={COLORS.accentGreen}
          change={chgMargin}
        />
        <KPICard
          label="Margine %"
          value={formatPercent(r.totalMarginPct)}
          subtitle={`Ricarico ${formatPercent(r.totalMarkupPct)}`}
          icon={Percent}
          accentColor={COLORS.accentPurple}
          change={chgMarginPct}
        />
        <KPICard
          label="Scontrino Medio"
          value={formatCurrency(avgTicket)}
          subtitle={`${piecesPerSale.toFixed(1).replace(".", ",")} pezzi/vendita`}
          icon={CreditCard}
          accentColor={COLORS.accentBlue}
          change={chgAvgTicket}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top 5 \u00B7 Costo vs Margine">
          <Top5CostMarginChart
            sectors={r.sectors}
            comparisonSectors={comp?.sectors}
          />
        </SectionCard>
        <SectionCard title="Distribuzione Venduto/Margine">
          <DistributionChart sectors={r.sectors} />
        </SectionCard>
      </div>

      {/* Full-width Margin Chart */}
      <SectionCard title="Margine % per Settore">
        <MarginBySectorChart
          sectors={r.sectors}
          comparisonSectors={comp?.sectors}
        />
      </SectionCard>

      {/* Sector List */}
      <SectionCard title="Tutti i Settori" subtitle={`${r.sectors.length} categorie`}>
        <SectorList sectors={r.sectors} />
      </SectionCard>

      {/* Footer */}
      <p className="pb-4 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim">
        Pharma Control \u00B7 Powered by DottHouse.ai
      </p>
    </div>
  );
}
