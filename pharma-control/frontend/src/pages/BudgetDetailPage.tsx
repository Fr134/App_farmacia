import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  Receipt,
  Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBudget } from "@/hooks/useBudget";
import { updateBudget } from "@/services/api";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import KPICard from "@/components/ui/KPICard";
import RevenueTab from "@/components/budget/RevenueTab";
import CostsTab from "@/components/budget/CostsTab";
import type { Budget, BudgetRevenueLine, BudgetSummary } from "@/types";

type TabKey = "revenue" | "costs";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-accent-amber/15", text: "text-accent-amber", label: "Draft" },
  CONFIRMED: { bg: "bg-accent-green/15", text: "text-accent-green", label: "Confirmed" },
  ARCHIVED: { bg: "bg-text-dim/15", text: "text-text-dim", label: "Archived" },
};

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { budget, summary, loading, error, setBudget, setSummary } = useBudget(id);
  const [activeTab, setActiveTab] = useState<TabKey>("revenue");
  const [toggling, setToggling] = useState(false);

  const locked = budget?.status !== "DRAFT";

  async function toggleStatus() {
    if (!budget || !id) return;
    const newStatus = budget.status === "DRAFT" ? "CONFIRMED" : "DRAFT";
    setToggling(true);
    try {
      const result = await updateBudget(id, { status: newStatus });
      setBudget(result.budget);
      setSummary(result.summary);
    } catch {
      // handled by api client
    } finally {
      setToggling(false);
    }
  }

  function handleRevenueUpdate(lines: BudgetRevenueLine[], newSummary: BudgetSummary) {
    if (!budget) return;
    setBudget({ ...budget, revenueLines: lines });
    setSummary(newSummary);
  }

  function handleCostsUpdate(updatedBudget: Budget, newSummary: BudgetSummary) {
    setBudget(updatedBudget);
    setSummary(newSummary);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-border-card animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary animate-pulse" />
      </div>
    );
  }

  if (error || !budget || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-dim">
        <p className="text-sm">{error ?? "Budget not found"}</p>
        <button
          onClick={() => navigate("/budget")}
          className="mt-3 rounded-btn px-4 py-2 text-xs font-medium text-accent-blue hover:bg-accent-blue/10 transition-colors"
        >
          Back to budgets
        </button>
      </div>
    );
  }

  const status = STATUS_STYLES[budget.status] ?? STATUS_STYLES.DRAFT;
  const ebitdaPositive = summary.estimatedEBITDA >= 0;

  return (
    <div className="space-y-6">
      {/* Confirmed banner */}
      {locked && (
        <div className="flex items-center gap-2 rounded-btn border border-accent-amber/30 bg-accent-amber/5 p-3">
          <Lock className="h-4 w-4 text-accent-amber" />
          <span className="text-xs text-text-muted">
            This budget is confirmed and locked for editing.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/budget")}
            className="flex items-center gap-1 text-xs text-text-dim hover:text-text-primary transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to budgets
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{budget.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-dim">
            Year: {budget.year} &nbsp;|&nbsp; Baseline: {budget.baselineSource === "HISTORICAL" ? `Historical ${budget.baselineYear}` : "Manual"}
            &nbsp;|&nbsp; Last updated: {new Date(budget.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-btn px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              budget.status === "DRAFT"
                ? "bg-accent-green text-white hover:bg-accent-green/90"
                : "border border-border-card text-text-muted hover:bg-white/[0.05]"
            }`}
          >
            {budget.status === "DRAFT" ? (
              <>
                <Lock className="h-4 w-4" /> Confirm budget
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" /> Reopen budget
              </>
            )}
          </button>
        )}
      </div>

      {/* KPI summary bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Forecast Revenue"
          value={formatCurrency(summary.totalForecastRevenue)}
          icon={DollarSign}
          accentColor={COLORS.accentBlue}
        />
        <KPICard
          label="Est. Gross Margin"
          value={formatCurrency(summary.totalForecastMargin)}
          subtitle={`${formatPercent(summary.forecastMarginPct)} margin`}
          icon={TrendingUp}
          accentColor={COLORS.accentGreen}
        />
        <KPICard
          label="Annual Costs"
          value={formatCurrency(summary.totalAnnualExpenses)}
          icon={Receipt}
          accentColor={COLORS.accentAmber}
        />
        <KPICard
          label="Est. EBITDA"
          value={formatCurrency(summary.estimatedEBITDA)}
          subtitle={`${formatPercent(summary.ebitdaMarginPct)} margin`}
          icon={Target}
          accentColor={ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-card">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "revenue"
              ? "border-accent-blue text-text-primary"
              : "border-transparent text-text-dim hover:text-text-muted"
          }`}
        >
          Revenue Forecast
        </button>
        <button
          onClick={() => setActiveTab("costs")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "costs"
              ? "border-accent-blue text-text-primary"
              : "border-transparent text-text-dim hover:text-text-muted"
          }`}
        >
          Costs & EBITDA
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-5">
        {activeTab === "revenue" ? (
          <RevenueTab
            budget={budget}
            onUpdate={handleRevenueUpdate}
            locked={locked}
          />
        ) : (
          <CostsTab
            budget={budget}
            summary={summary}
            onUpdate={handleCostsUpdate}
            locked={locked}
          />
        )}
      </div>
    </div>
  );
}
