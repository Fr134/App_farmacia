import { useNavigate } from "react-router-dom";
import { ArrowRight, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import type { BudgetWithSummary } from "@/types";

interface BudgetCardProps {
  budget: BudgetWithSummary;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-accent-amber/15", text: "text-accent-amber", label: "Bozza" },
  CONFIRMED: { bg: "bg-accent-green/15", text: "text-accent-green", label: "Confermato" },
  ARCHIVED: { bg: "bg-text-dim/15", text: "text-text-dim", label: "Archiviato" },
};

export default function BudgetCard({ budget, onDelete, isAdmin }: BudgetCardProps) {
  const navigate = useNavigate();
  const s = budget.summary;
  const status = STATUS_STYLES[budget.status] ?? STATUS_STYLES.DRAFT;
  const ebitdaPositive = s.estimatedEBITDA >= 0;

  return (
    <div className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-semibold text-accent-blue">
            {budget.year}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        <h3 className="text-base font-bold text-text-primary mb-1">{budget.name}</h3>
        <p className="text-[11px] text-text-dim mb-4">
          Base: {budget.baselineSource === "HISTORICAL" ? `Storica ${budget.baselineYear}` : "Manuale"}
        </p>

        {/* Metrics */}
        <div className="space-y-2 border-t border-border-card pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Ricavo Previsto</span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrency(s.totalForecastRevenue)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Margine Lordo Previsto</span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrency(s.totalForecastMargin)}{" "}
              <span className="text-text-dim text-xs">({formatPercent(s.forecastMarginPct)})</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Costi Annuali</span>
            <span className="font-mono font-semibold text-text-primary">
              {formatCurrency(s.totalAnnualExpenses)}
            </span>
          </div>
        </div>

        <div className="border-t border-border-card mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-text-primary">EBITDA Stimato</span>
            <span
              className="font-mono font-bold"
              style={{ color: ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed }}
            >
              {formatCurrency(s.estimatedEBITDA)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-dim">margine EBITDA</span>
            <span
              className="font-mono font-medium"
              style={{ color: ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed }}
            >
              {formatPercent(s.ebitdaMarginPct)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-card">
          <button
            onClick={() => navigate(`/budget/${budget.id}`)}
            className="flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/10 transition-colors"
          >
            Modifica budget <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {isAdmin && budget.status === "DRAFT" && (
            <button
              onClick={() => onDelete(budget.id)}
              className="rounded-btn p-1.5 text-text-dim hover:bg-accent-red/10 hover:text-accent-red transition-colors"
              title="Elimina budget"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
