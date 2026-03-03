import { useState } from "react";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Expense, ExpenseCategory, RecurrenceType } from "@/types";

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "Una tantum",
  MONTHLY: "Mensile",
  QUARTERLY: "Trimestrale",
  ANNUAL: "Annuale",
};

const RECURRENCE_COLORS: Record<RecurrenceType, string> = {
  NONE: "bg-text-dim/20 text-text-dim",
  MONTHLY: "bg-accent-blue/15 text-accent-blue",
  QUARTERLY: "bg-accent-purple/15 text-accent-purple",
  ANNUAL: "bg-accent-amber/15 text-accent-amber",
};

interface ExpensesTableProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  isAdmin: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpensesTable({
  expenses,
  categories,
  isAdmin,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    if (filterCategory && e.categoryId !== filterCategory) return false;
    if (filterRecurrence && e.recurrenceType !== filterRecurrence) return false;
    return true;
  });

  function handleDeleteClick(id: string) {
    setDeleteConfirm(id);
  }

  function confirmDelete() {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-btn border border-border-card bg-bg-card px-3 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterRecurrence}
          onChange={(e) => setFilterRecurrence(e.target.value)}
          className="rounded-btn border border-border-card bg-bg-card px-3 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
        >
          <option value="">Tutte le ricorrenze</option>
          <option value="MONTHLY">Mensile</option>
          <option value="QUARTERLY">Trimestrale</option>
          <option value="ANNUAL">Annuale</option>
          <option value="NONE">Una tantum</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-dim">
          <p className="text-sm">Nessuna spesa trovata</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-card text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">
                <th className="pb-3 pr-4">Categoria</th>
                <th className="pb-3 pr-4">Nome</th>
                <th className="pb-3 pr-4 text-right">Netto</th>
                <th className="pb-3 pr-4 text-right">Lordo</th>
                <th className="pb-3 pr-4">IVA</th>
                <th className="pb-3 pr-4">Ricorrenza</th>
                <th className="pb-3 pr-4">Tipo</th>
                <th className="pb-3 pr-4">Da</th>
                {isAdmin && <th className="pb-3 text-right">Azioni</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/50">
              {filtered.map((exp) => (
                <tr
                  key={exp.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                >
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${exp.category.color ?? "#7b849a"}20`,
                        color: exp.category.color ?? "#7b849a",
                      }}
                    >
                      {exp.category.icon} {exp.category.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-text-primary">{exp.name}</p>
                    {exp.description && (
                      <p className="mt-0.5 text-[11px] text-text-dim truncate max-w-[200px]">
                        {exp.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-text-primary">
                    {formatCurrency(exp.amountNet)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-text-muted">
                    {formatCurrency(exp.amountGross)}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">
                    {formatPercent(exp.vatRate)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        RECURRENCE_COLORS[exp.recurrenceType]
                      }`}
                    >
                      {RECURRENCE_LABELS[exp.recurrenceType]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        exp.isFixedCost
                          ? "bg-accent-cyan/15 text-accent-cyan"
                          : "bg-accent-green/15 text-accent-green"
                      }`}
                    >
                      {exp.isFixedCost ? "Fisso" : "Variabile"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-muted text-[12px]">
                    {new Date(exp.validFrom).toLocaleDateString("it-IT")}
                  </td>
                  {isAdmin && (
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(exp)}
                          className="rounded-btn p-1.5 text-text-dim hover:bg-accent-blue/10 hover:text-accent-blue transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exp.id)}
                          className="rounded-btn p-1.5 text-text-dim hover:bg-accent-red/10 hover:text-accent-red transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-card border border-border-card bg-bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-accent-red/10 p-2">
                <AlertTriangle className="h-5 w-5 text-accent-red" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                Conferma eliminazione
              </h3>
            </div>
            <p className="text-sm text-text-muted mb-6">
              Sei sicuro di voler eliminare questa spesa? L'azione non e
              reversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-btn px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-btn bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-accent-red/90 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
