import { useState } from "react";
import { Lock, Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import {
  createBudgetExpenseLine,
  updateBudgetExpenseLine,
  deleteBudgetExpenseLine,
} from "@/services/api";
import BudgetExpenseForm from "./BudgetExpenseForm";
import type { Budget, BudgetExpenseLine, BudgetSummary, RecurrenceType } from "@/types";

interface CostsTabProps {
  budget: Budget;
  summary: BudgetSummary;
  onUpdate: (budget: Budget, summary: BudgetSummary) => void;
  locked: boolean;
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "One-time",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

function monthlyAmount(line: BudgetExpenseLine): number {
  switch (line.recurrenceType) {
    case "MONTHLY": return line.amountNet;
    case "QUARTERLY": return Math.round(line.amountNet / 3 * 100) / 100;
    case "ANNUAL": return Math.round(line.amountNet / 12 * 100) / 100;
    case "NONE": return 0;
    default: return 0;
  }
}

export default function CostsTab({ budget, summary, onUpdate, locked }: CostsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetExpenseLine | null>(null);
  const [saving, setSaving] = useState(false);

  const structural = budget.expenseLines.filter((l) => l.isStructural);
  const additional = budget.expenseLines.filter((l) => !l.isStructural);

  const structuralTotals = structural.reduce(
    (acc, l) => ({
      monthly: acc.monthly + monthlyAmount(l),
      annualNet: acc.annualNet + l.annualAmountNet,
      annualGross: acc.annualGross + l.amountGross * (l.recurrenceType === "MONTHLY" ? 12 : l.recurrenceType === "QUARTERLY" ? 4 : 1),
    }),
    { monthly: 0, annualNet: 0, annualGross: 0 }
  );

  const additionalTotals = additional.reduce(
    (acc, l) => ({
      monthly: acc.monthly + monthlyAmount(l),
      annualNet: acc.annualNet + l.annualAmountNet,
      annualGross: acc.annualGross + l.amountGross * (l.recurrenceType === "MONTHLY" ? 12 : l.recurrenceType === "QUARTERLY" ? 4 : 1),
    }),
    { monthly: 0, annualNet: 0, annualGross: 0 }
  );

  async function handleSave(data: {
    name: string;
    categoryLabel: string;
    amountNet: number;
    vatRate: number;
    recurrenceType: RecurrenceType;
    notes?: string;
  }) {
    setSaving(true);
    try {
      if (editingLine) {
        const result = await updateBudgetExpenseLine(budget.id, editingLine.id, data);
        const updatedLines = budget.expenseLines.map((l) =>
          l.id === editingLine.id ? result.expenseLine : l
        );
        onUpdate({ ...budget, expenseLines: updatedLines }, result.summary);
      } else {
        const result = await createBudgetExpenseLine(budget.id, data);
        onUpdate(
          { ...budget, expenseLines: [...budget.expenseLines, result.expenseLine] },
          result.summary
        );
      }
      setFormOpen(false);
      setEditingLine(null);
    } catch {
      // handled by api client
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lineId: string) {
    try {
      const result = await deleteBudgetExpenseLine(budget.id, lineId);
      onUpdate(
        { ...budget, expenseLines: budget.expenseLines.filter((l) => l.id !== lineId) },
        result.summary
      );
    } catch {
      // handled by api client
    }
  }

  function renderExpenseTable(lines: BudgetExpenseLine[], showActions: boolean) {
    if (lines.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-text-dim">
          <p className="text-sm">No items yet.</p>
        </div>
      );
    }

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-card text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Category</th>
            <th className="pb-2 pr-4 text-right">Monthly</th>
            <th className="pb-2 pr-4 text-right">Annual net</th>
            <th className="pb-2 pr-4 text-right">Annual gross</th>
            <th className="pb-2 pr-4">Recurrence</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-border-card/50 hover:bg-white/[0.02]">
              <td className="py-2.5 pr-4 text-text-primary font-medium">{line.name}</td>
              <td className="py-2.5 pr-4 text-text-dim">{line.categoryLabel}</td>
              <td className="py-2.5 pr-4 text-right font-mono text-text-muted">
                {formatCurrency(monthlyAmount(line))}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-text-primary">
                {formatCurrency(line.annualAmountNet)}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-text-dim">
                {formatCurrency(line.amountGross * (line.recurrenceType === "MONTHLY" ? 12 : line.recurrenceType === "QUARTERLY" ? 4 : 1))}
              </td>
              <td className="py-2.5 pr-4">
                <span className="text-xs text-text-dim">{RECURRENCE_LABELS[line.recurrenceType]}</span>
              </td>
              <td className="py-2.5 text-right">
                {line.isStructural ? (
                  <Lock className="h-4 w-4 text-text-dim/50 inline" />
                ) : showActions ? (
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => {
                        setEditingLine(line);
                        setFormOpen(true);
                      }}
                      className="rounded-btn p-1 text-text-dim hover:bg-white/[0.05] hover:text-text-primary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(line.id)}
                      className="rounded-btn p-1 text-text-dim hover:bg-accent-red/10 hover:text-accent-red transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // EBITDA waterfall values
  const forecastRevenue = summary.totalForecastRevenue;
  const forecastCOGS = summary.totalForecastCOGS;
  const forecastMargin = summary.totalForecastMargin;
  const ebitda = summary.estimatedEBITDA;
  const ebitdaPositive = ebitda >= 0;

  function waterfallBar(value: number, maxValue: number, color: string) {
    const pct = maxValue > 0 ? Math.min(Math.abs(value) / maxValue * 100, 100) : 0;
    return (
      <div className="h-2 rounded-full bg-white/5 w-full mt-1">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Structural costs */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-sm font-semibold text-text-primary">Structural Costs</h3>
          <p className="mt-0.5 text-[12px] text-text-dim">
            Imported automatically from the Expenses module. Edit them in Setup &gt; Expenses.
          </p>
        </div>
        <div className="px-5 pb-5">
          {renderExpenseTable(structural, false)}
          {structural.length > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-card text-sm font-semibold">
              <span className="text-text-primary">STRUCTURAL TOTAL</span>
              <div className="flex gap-8 text-right">
                <span className="font-mono text-text-muted">{formatCurrency(structuralTotals.monthly)}/mo</span>
                <span className="font-mono text-text-primary">{formatCurrency(structuralTotals.annualNet)}</span>
                <span className="font-mono text-text-dim">{formatCurrency(structuralTotals.annualGross)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Additional costs */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Additional Costs & Investments</h3>
            <p className="mt-0.5 text-[12px] text-text-dim">
              Add extra costs or one-time investments specific to this budget.
            </p>
          </div>
          {!locked && (
            <button
              onClick={() => {
                setEditingLine(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-btn bg-accent-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-blue/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add cost
            </button>
          )}
        </div>
        <div className="px-5 pb-5">
          {renderExpenseTable(additional, !locked)}
          {additional.length > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-card text-sm font-semibold">
              <span className="text-text-primary">ADDITIONAL TOTAL</span>
              <div className="flex gap-8 text-right">
                <span className="font-mono text-text-muted">{formatCurrency(additionalTotals.monthly)}/mo</span>
                <span className="font-mono text-text-primary">{formatCurrency(additionalTotals.annualNet)}</span>
                <span className="font-mono text-text-dim">{formatCurrency(additionalTotals.annualGross)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: EBITDA Waterfall */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-sm font-semibold text-text-primary">P&L Summary</h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {/* Revenue */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-primary font-medium">Forecast Revenue</span>
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold text-text-primary">{formatCurrency(forecastRevenue)}</span>
                <span className="font-mono text-xs text-text-dim w-16 text-right">100%</span>
              </div>
            </div>
            {waterfallBar(forecastRevenue, forecastRevenue, COLORS.accentBlue)}
          </div>

          {/* COGS */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-dim pl-4">Cost of goods sold</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-accent-red">-{formatCurrency(forecastCOGS)}</span>
                <span className="font-mono text-xs text-text-dim w-16 text-right">
                  -{forecastRevenue > 0 ? formatPercent(forecastCOGS / forecastRevenue * 100) : "0%"}
                </span>
              </div>
            </div>
            {waterfallBar(forecastCOGS, forecastRevenue, COLORS.accentRed)}
          </div>

          <div className="border-t border-border-card" />

          {/* Gross margin */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-primary font-medium">Forecast Gross Margin</span>
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold" style={{ color: COLORS.accentGreen }}>
                  {formatCurrency(forecastMargin)}
                </span>
                <span className="font-mono text-xs text-text-dim w-16 text-right">
                  {formatPercent(summary.forecastMarginPct)}
                </span>
              </div>
            </div>
            {waterfallBar(forecastMargin, forecastRevenue, COLORS.accentGreen)}
          </div>

          {/* Structural costs */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-dim pl-4">Structural costs</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-accent-red">-{formatCurrency(structuralTotals.annualNet)}</span>
                <span className="font-mono text-xs text-text-dim w-16 text-right">
                  -{forecastRevenue > 0 ? formatPercent(structuralTotals.annualNet / forecastRevenue * 100) : "0%"}
                </span>
              </div>
            </div>
            {waterfallBar(structuralTotals.annualNet, forecastRevenue, COLORS.accentAmber)}
          </div>

          {/* Additional costs */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-dim pl-4">Additional costs</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-accent-red">-{formatCurrency(additionalTotals.annualNet)}</span>
                <span className="font-mono text-xs text-text-dim w-16 text-right">
                  -{forecastRevenue > 0 ? formatPercent(additionalTotals.annualNet / forecastRevenue * 100) : "0%"}
                </span>
              </div>
            </div>
            {waterfallBar(additionalTotals.annualNet, forecastRevenue, COLORS.accentPurple)}
          </div>

          <div className="border-t-2 border-border-card" />

          {/* EBITDA */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-text-primary font-bold">Estimated EBITDA</span>
              <div className="flex items-center gap-4">
                <span
                  className="font-mono font-bold text-base"
                  style={{ color: ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed }}
                >
                  {formatCurrency(ebitda)}
                </span>
                <span
                  className="font-mono text-xs w-16 text-right"
                  style={{ color: ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed }}
                >
                  {formatPercent(summary.ebitdaMarginPct)}
                </span>
              </div>
            </div>
            {waterfallBar(Math.abs(ebitda), forecastRevenue, ebitdaPositive ? COLORS.accentGreen : COLORS.accentRed)}
          </div>
        </div>

        {/* EBITDA alert banner */}
        <div className="px-5 pb-5">
          {ebitdaPositive ? (
            <div className="flex items-start gap-3 rounded-btn border border-accent-green/30 bg-accent-green/5 p-3">
              <CheckCircle className="h-4 w-4 mt-0.5 text-accent-green shrink-0" />
              <p className="text-xs text-text-muted">
                This budget projects a profit of{" "}
                <span className="font-mono font-semibold text-accent-green">{formatCurrency(ebitda)}</span>{" "}
                ({formatPercent(summary.ebitdaMarginPct)} margin).
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-btn border border-accent-red/30 bg-accent-red/5 p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-accent-red shrink-0" />
              <p className="text-xs text-text-muted">
                This budget projects a loss of{" "}
                <span className="font-mono font-semibold text-accent-red">{formatCurrency(Math.abs(ebitda))}</span>.
                Review your cost structure or revenue assumptions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expense form slide-over */}
      <BudgetExpenseForm
        open={formOpen}
        line={editingLine}
        saving={saving}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false);
          setEditingLine(null);
        }}
      />
    </div>
  );
}
