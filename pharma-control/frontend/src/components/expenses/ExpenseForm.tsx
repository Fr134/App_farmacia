import { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Expense, ExpenseCategory, Supplier, RecurrenceType } from "@/types";

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; color: string }[] = [
  { value: "MONTHLY", label: "Mensile", color: "bg-accent-blue" },
  { value: "QUARTERLY", label: "Trimestrale", color: "bg-accent-purple" },
  { value: "ANNUAL", label: "Annuale", color: "bg-accent-amber" },
  { value: "NONE", label: "Una tantum", color: "bg-text-dim" },
];

interface ExpenseFormProps {
  open: boolean;
  expense: Expense | null;
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  saving: boolean;
  onSave: (data: ExpenseFormPayload) => void;
  onClose: () => void;
}

export interface ExpenseFormPayload {
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  amountNet: number;
  vatRate: number;
  isVatDeductible: boolean;
  recurrenceType: RecurrenceType;
  isFixedCost: boolean;
  validFrom: string;
  validTo?: string;
  notes?: string;
}

export default function ExpenseForm({
  open,
  expense,
  categories,
  suppliers,
  saving,
  onSave,
  onClose,
}: ExpenseFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [amountNet, setAmountNet] = useState("");
  const [vatRate, setVatRate] = useState("22");
  const [isVatDeductible, setIsVatDeductible] = useState(true);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("MONTHLY");
  const [isFixedCost, setIsFixedCost] = useState(false);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setDescription(expense.description ?? "");
      setCategoryId(expense.categoryId);
      setSupplierId(expense.supplierId ?? "");
      setAmountNet(expense.amountNet.toString().replace(".", ","));
      setVatRate(expense.vatRate.toString().replace(".", ","));
      setIsVatDeductible(expense.isVatDeductible);
      setRecurrenceType(expense.recurrenceType);
      setIsFixedCost(expense.isFixedCost);
      setValidFrom(expense.validFrom.slice(0, 10));
      setValidTo(expense.validTo ? expense.validTo.slice(0, 10) : "");
      setNotes(expense.notes ?? "");
    } else {
      setName("");
      setDescription("");
      setCategoryId(categories[0]?.id ?? "");
      setSupplierId("");
      setAmountNet("");
      setVatRate("22");
      setIsVatDeductible(true);
      setRecurrenceType("MONTHLY");
      setIsFixedCost(false);
      setValidFrom(new Date().toISOString().slice(0, 10));
      setValidTo("");
      setNotes("");
    }
    setErrors({});
  }, [expense, open, categories]);

  const parsedNet = useMemo(() => {
    const cleaned = amountNet.trim().replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }, [amountNet]);

  const parsedVat = useMemo(() => {
    const cleaned = vatRate.trim().replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }, [vatRate]);

  const computedGross = useMemo(
    () => Math.round(parsedNet * (1 + parsedVat / 100) * 100) / 100,
    [parsedNet, parsedVat]
  );

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome obbligatorio";
    if (!categoryId) errs.categoryId = "Categoria obbligatoria";
    if (parsedNet <= 0) errs.amountNet = "Importo deve essere positivo";
    if (parsedVat < 0 || parsedVat > 100) errs.vatRate = "IVA tra 0 e 100";
    if (!validFrom) errs.validFrom = "Data inizio obbligatoria";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId,
      supplierId: supplierId || undefined,
      amountNet: parsedNet,
      vatRate: parsedVat,
      isVatDeductible,
      recurrenceType,
      isFixedCost,
      validFrom,
      validTo: validTo || undefined,
      notes: notes.trim() || undefined,
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border-card bg-bg-primary shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {expense ? "Modifica Spesa" : "Nuova Spesa"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-btn p-1.5 text-text-dim hover:bg-white/[0.05] hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Affitto locale"
              className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none ${
                errors.name ? "border-accent-red" : "border-border-card focus:border-accent-blue"
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-accent-red">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Descrizione
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opzionale"
              className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Categoria *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none ${
                errors.categoryId ? "border-accent-red" : "border-border-card focus:border-accent-blue"
              }`}
            >
              <option value="">Seleziona categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-[11px] text-accent-red">{errors.categoryId}</p>}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Fornitore
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none"
            >
              <option value="">Nessun fornitore</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ragioneSociale}
                </option>
              ))}
            </select>
          </div>

          {/* Amount + VAT row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Importo Netto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-dim">
                  &euro;
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountNet}
                  onChange={(e) => setAmountNet(e.target.value)}
                  placeholder="0,00"
                  className={`w-full rounded-btn border bg-bg-card pl-7 pr-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/50 focus:outline-none ${
                    errors.amountNet ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                  }`}
                />
              </div>
              {errors.amountNet && <p className="mt-1 text-[11px] text-accent-red">{errors.amountNet}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Aliquota IVA
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className={`w-full rounded-btn border bg-bg-card px-3 py-2 pr-7 text-sm font-mono text-text-primary focus:outline-none ${
                    errors.vatRate ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-dim">
                  %
                </span>
              </div>
              {errors.vatRate && <p className="mt-1 text-[11px] text-accent-red">{errors.vatRate}</p>}
            </div>
          </div>

          {/* Live gross calculation */}
          <div className="rounded-btn border border-border-card bg-white/[0.02] p-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">Importo Lordo (calcolato)</span>
            <span className="font-mono text-sm font-semibold text-text-primary">
              {formatCurrency(computedGross)}
            </span>
          </div>

          {/* VAT Deductible toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                isVatDeductible ? "bg-accent-blue" : "bg-border-card"
              }`}
              onClick={() => setIsVatDeductible(!isVatDeductible)}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  isVatDeductible ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm text-text-muted">IVA detraibile</span>
          </label>

          {/* Recurrence Type — 2×2 pill grid */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-2">
              Ricorrenza
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrenceType(opt.value)}
                  className={`rounded-btn px-3 py-2 text-xs font-medium transition-all ${
                    recurrenceType === opt.value
                      ? `${opt.color} text-white`
                      : "border border-border-card bg-bg-card text-text-muted hover:border-text-dim"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fixed cost toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                isFixedCost ? "bg-accent-cyan" : "bg-border-card"
              }`}
              onClick={() => setIsFixedCost(!isFixedCost)}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  isFixedCost ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm text-text-muted">Costo fisso</span>
          </label>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Valido dal *
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none ${
                  errors.validFrom ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                }`}
              />
              {errors.validFrom && <p className="mt-1 text-[11px] text-accent-red">{errors.validFrom}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Valido fino a
              </label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Note aggiuntive..."
              className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-border-card px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {expense ? "Aggiorna" : "Crea Spesa"}
          </button>
        </div>
      </div>
    </>
  );
}
