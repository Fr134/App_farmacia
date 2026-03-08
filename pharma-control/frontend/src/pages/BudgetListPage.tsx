import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBudgets } from "@/hooks/useBudgets";
import { createBudget, deleteBudget } from "@/services/api";
import BudgetCard from "@/components/budget/BudgetCard";
import CreateBudgetModal from "@/components/budget/CreateBudgetModal";

export default function BudgetListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { budgets, loading, error, refetch } = useBudgets();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(data: {
    name: string;
    year: number;
    baselineSource: "HISTORICAL" | "MANUAL";
    baselineYear?: number;
    notes?: string;
  }) {
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createBudget(data);
      setModalOpen(false);
      navigate(`/budget/${result.budget.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    try {
      await deleteBudget(id);
      refetch();
    } catch {
      // error handled by api client
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Budget & Forecasting
          </h1>
          <p className="mt-1 text-sm text-text-dim">
            Annual revenue forecasts and cost planning
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Budget
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-dim">
          <p className="text-sm">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-btn px-4 py-2 text-xs font-medium text-accent-blue hover:bg-accent-blue/10 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-accent-blue/10 p-4 mb-4">
            <BarChart3 className="h-8 w-8 text-accent-blue" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-1">
            No budgets yet
          </h2>
          <p className="text-sm text-text-dim mb-4">
            Create your first budget to start forecasting
          </p>
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Budget
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateBudgetModal
        open={modalOpen}
        saving={creating}
        serverError={createError}
        onClose={() => { setModalOpen(false); setCreateError(null); }}
        onSubmit={handleCreate}
      />
    </div>
  );
}
