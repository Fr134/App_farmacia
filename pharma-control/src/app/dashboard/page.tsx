"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useReport } from "@/hooks/use-report";
import { MESI_DISPLAY, COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatPercent,
  formatInteger,
} from "@/lib/formatters";
import KPICard from "@/components/ui/kpi-card";
import SectionCard from "@/components/ui/section-card";
import PeriodSelector from "@/components/dashboard/period-selector";
import Top5CostMarginChart from "@/components/dashboard/top5-cost-margin-chart";
import DistributionChart from "@/components/dashboard/distribution-chart";
import MarginBySectorChart from "@/components/dashboard/margin-by-sector-chart";
import SectorList from "@/components/dashboard/sector-list";

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { report, loading, error, empty } = useReport(selectedId);

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
          href="/upload"
          className="rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
        >
          Carica un CSV
        </Link>
      </div>
    );
  }

  // Derived values
  const r = report;
  const monthName = MESI_DISPLAY[r.periodMonth] ?? `${r.periodMonth}`;
  const costPct =
    r.totalRevenueGross > 0
      ? (r.totalCost / r.totalRevenueGross) * 100
      : 0;
  const avgTicket =
    r.totalSales > 0 ? r.totalRevenueGross / r.totalSales : 0;
  const piecesPerSale =
    r.totalSales > 0 ? r.totalPieces / r.totalSales : 0;

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
        <PeriodSelector
          currentMonth={r.periodMonth}
          currentYear={r.periodYear}
          onSelect={setSelectedId}
        />
      </div>

      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Transato Lordo"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle="IVA inclusa"
          icon={Banknote}
          accentColor={COLORS.accentBlue}
        />
        <KPICard
          label="Fatturato Netto"
          value={formatCurrency(r.totalRevenueNet)}
          subtitle={`di cui IVA ${formatCurrency(r.totalIva)}`}
          icon={FileText}
          accentColor={COLORS.accentCyan}
        />
        <KPICard
          label="Venduto"
          value={formatCurrency(r.totalRevenueGross)}
          subtitle={`${formatInteger(r.totalPieces)} pezzi · ${formatInteger(r.totalSales)} vendite`}
          icon={ShoppingBag}
          accentColor={COLORS.accentGreen}
        />
        <KPICard
          label="Costo del Venduto"
          value={formatCurrency(r.totalCost)}
          subtitle={`${formatPercent(costPct)} del transato`}
          icon={Wallet}
          accentColor={COLORS.accentAmber}
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
        />
        <KPICard
          label="Margine %"
          value={formatPercent(r.totalMarginPct)}
          subtitle={`Ricarico ${formatPercent(r.totalMarkupPct)}`}
          icon={Percent}
          accentColor={COLORS.accentPurple}
        />
        <KPICard
          label="Scontrino Medio"
          value={formatCurrency(avgTicket)}
          subtitle={`${piecesPerSale.toFixed(1).replace(".", ",")} pezzi/vendita`}
          icon={CreditCard}
          accentColor={COLORS.accentBlue}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top 5 · Costo vs Margine">
          <Top5CostMarginChart sectors={r.sectors} />
        </SectionCard>
        <SectionCard title="Distribuzione Venduto/Margine">
          <DistributionChart sectors={r.sectors} />
        </SectionCard>
      </div>

      {/* Full-width Margin Chart */}
      <SectionCard title="Margine % per Settore">
        <MarginBySectorChart sectors={r.sectors} />
      </SectionCard>

      {/* Sector List */}
      <SectionCard title="Tutti i Settori" subtitle={`${r.sectors.length} categorie`}>
        <SectorList sectors={r.sectors} />
      </SectionCard>

      {/* Footer */}
      <p className="pb-4 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim">
        Pharma Control · Powered by DottHouse.ai
      </p>
    </div>
  );
}
