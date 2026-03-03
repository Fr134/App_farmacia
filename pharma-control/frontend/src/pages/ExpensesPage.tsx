import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Lock,
  TrendingDown,
  Plus,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  getExpenses,
  getExpenseSummary,
  getExpenseCategories,
  getSuppliers,
  createExpense,
  updateExpense,
  deleteExpense,
  getLatestReport,
} from "@/services/api";
import { formatCurrency } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import KPICard from "@/components/ui/KPICard";
import SectionCard from "@/components/ui/SectionCard";
import KPICardSkeleton from "@/components/ui/KPICardSkeleton";
import ExpensesTable from "@/components/expenses/ExpensesTable";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import type { ExpenseFormPayload } from "@/components/expenses/ExpenseForm";
import type { Expense, ExpenseCategory, Supplier, ExpenseSummary } from "@/types";

export default function ExpensesPage() {
  const { isAdmin } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  // Latest report data for P&L (fetched separately to get gross margin)
  const [latestGrossMargin, setLatestGrossMargin] = useState<number | null>(null);
  const [latestRevenueGross, setLatestRevenueGross] = useState<number | null>(null);
  const [latestCost, setLatestCost] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expData, summaryData, cats, supps] = await Promise.all([
        getExpenses(),
        getExpenseSummary(),
        getExpenseCategories(),
        getSuppliers(),
      ]);
      setExpenses(expData.expenses);
      setSummary(summaryData);
      setCategories(cats);
      setSuppliers(supps);

      // Try to fetch latest report for P&L context
      try {
        const report = await getLatestReport();
        setLatestGrossMargin(report.totalMargin);
        setLatestRevenueGross(report.totalRevenueGross);
        setLatestCost(report.totalCost);
      } catch {
        // No reports available — that's fine
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleNewExpense() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  async function handleSave(data: ExpenseFormPayload) {
    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data as unknown as Record<string, unknown>);
      } else {
        await createExpense(data);
      }
      setFormOpen(false);
      setEditingExpense(null);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore nell'eliminazione");
    }
  }

  // EBITDA calculation
  const ebitda =
    latestGrossMargin != null && summary
      ? latestGrossMargin - summary.totalMonthlyGross
      : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-amber animate-pulse" />
          <div className="h-5 w-48 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-accent-red">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-amber" />
          <h1 className="text-lg font-semibold text-text-primary">
            Costi Operativi
          </h1>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewExpense}
            className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuova Spesa
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KPICard
            label="Costi Operativi Mensili"
            value={formatCurrency(summary.totalMonthlyGross)}
            subtitle={`Netto ${formatCurrency(summary.totalMonthlyNet)}`}
            icon={Wallet}
            accentColor={COLORS.accentAmber}
          />
          <KPICard
            label="Costi Fissi"
            value={formatCurrency(summary.fixedCostsMonthly)}
            subtitle={
              summary.totalMonthlyNet > 0
                ? `${((summary.fixedCostsMonthly / summary.totalMonthlyNet) * 100)
                    .toFixed(1)
                    .replace(".", ",")}% del totale`
                : "0% del totale"
            }
            icon={Lock}
            accentColor={COLORS.accentCyan}
          />
          <KPICard
            label="Costi Variabili"
            value={formatCurrency(summary.variableCostsMonthly)}
            subtitle={
              summary.totalMonthlyNet > 0
                ? `${((summary.variableCostsMonthly / summary.totalMonthlyNet) * 100)
                    .toFixed(1)
                    .replace(".", ",")}% del totale`
                : "0% del totale"
            }
            icon={TrendingDown}
            accentColor={COLORS.accentGreen}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Category Breakdown Chart */}
        {summary && summary.byCategory.length > 0 && (
          <SectionCard
            title="Ripartizione per Categoria"
            subtitle="Costi mensili normalizzati per categoria"
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.byCategory.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: COLORS.textDim, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      `\u20AC${(v / 1000).toFixed(1).replace(".", ",")}k`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.bgCard,
                      border: `1px solid ${COLORS.borderCard}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Mensile"]}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {summary.byCategory.slice(0, 8).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}

        {/* Simplified P&L Card */}
        <SectionCard
          title="Conto Economico Semplificato"
          subtitle="Dati ultimo mese disponibile"
        >
          <div className="space-y-3">
            {latestRevenueGross != null ? (
              <>
                <PLRow
                  label="Ricavi lordi"
                  value={latestRevenueGross}
                  color={COLORS.accentBlue}
                />
                <PLRow
                  label="Costo del venduto"
                  value={-(latestCost ?? 0)}
                  color={COLORS.accentAmber}
                />
                <div className="border-t border-border-card pt-2">
                  <PLRow
                    label="Margine Lordo"
                    value={latestGrossMargin ?? 0}
                    color={COLORS.accentGreen}
                    bold
                  />
                </div>
                <PLRow
                  label="Costi operativi"
                  value={-(summary?.totalMonthlyGross ?? 0)}
                  color={COLORS.accentRed}
                />
                <div className="border-t border-border-card pt-2">
                  <PLRow
                    label="EBITDA"
                    value={ebitda ?? 0}
                    color={ebitda != null && ebitda >= 0 ? COLORS.accentGreen : COLORS.accentRed}
                    bold
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-text-dim">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">Carica un report per vedere il P&L</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Expenses Table */}
      <SectionCard
        title="Elenco Spese"
        subtitle={`${expenses.length} ${expenses.length === 1 ? "spesa" : "spese"} registrate`}
      >
        <ExpensesTable
          expenses={expenses}
          categories={categories}
          isAdmin={isAdmin}
          onEdit={handleEditExpense}
          onDelete={handleDelete}
        />
      </SectionCard>

      {/* Passive Invoices — Coming Soon */}
      <div className="rounded-card border border-dashed border-border-card bg-gradient-to-b from-bg-card/50 to-transparent p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-accent-purple/10 p-2">
            <FileText className="h-5 w-5 text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Fatture Passive
            </h3>
            <p className="text-[12px] text-text-dim">
              Prossimamente &middot; Importazione automatica dal Cassetto Fiscale (AdE)
            </p>
          </div>
        </div>
        <p className="text-xs text-text-dim ml-[44px]">
          Potrai importare le fatture XML dal sistema SDI e riconciliarle
          automaticamente con le spese registrate.
        </p>
      </div>

      {/* Footer */}
      <p className="pb-4 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim">
        Pharma Control &middot; Powered by DottHouse.ai
      </p>

      {/* Expense Form Slide-over */}
      <ExpenseForm
        open={formOpen}
        expense={editingExpense}
        categories={categories}
        suppliers={suppliers}
        saving={saving}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
      />
    </div>
  );
}

// P&L row helper
function PLRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${bold ? "font-semibold text-text-primary" : "text-text-muted"}`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm ${bold ? "font-bold" : "font-medium"}`}
        style={{ color }}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
