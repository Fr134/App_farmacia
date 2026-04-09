import { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { BudgetExpenseLine, RecurrenceType } from "@/types";

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; color: string }[] = [
  { value: "NONE", label: "Una tantum", color: "bg-text-dim" },
  { value: "MONTHLY", label: "Mensile", color: "bg-accent-blue" },
  { value: "QUARTERLY", label: "Trimestrale", color: "bg-accent-purple" },
  { value: "ANNUAL", label: "Annuale", color: "bg-accent-amber" },
];

const VAT_RATES = [0, 4, 5, 10, 22];

const ANNUAL_MULTIPLIER: Record<RecurrenceType, { factor: number; label: string }> = {
  NONE: { factor: 1, label: "una tantum" },
  MONTHLY: { factor: 12, label: "12 mesi" },
  QUARTERLY: { factor: 4, label: "4 trimestri" },
  ANNUAL: { factor: 1, label: "1 anno" },
};

interface BudgetExpenseFormProps {
  open: boolean;
  line: BudgetExpenseLine | null;
  saving: boolean;
  onSave: (data: {
    name: string;
    categoryLabel: string;
    amountNet: number;
    vatRate: number;
    recurrenceType: RecurrenceType;
    notes?: string;
  }) => void;
  onClose: () => void;
}

export default function BudgetExpenseForm({
  open,
  line,
  saving,
  onSave,
  onClose,
}: BudgetExpenseFormProps) {
  const [name, setName] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [amountNet, setAmountNet] = useState("");
  const [vatRate, setVatRate] = useState("22");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("MONTHLY");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (line) {
      setName(line.name);
      setCategoryLabel(line.categoryLabel);
      setAmountNet(line.amountNet.toString().replace(".", ","));
      setVatRate(line.vatRate.toString());
      setRecurrenceType(line.recurrenceType);
      setNotes(line.notes ?? "");
    } else {
      setName("");
      setCategoryLabel("");
      setAmountNet("");
      setVatRate("22");
      setRecurrenceType("MONTHLY");
      setNotes("");
    }
    setErrors({});
  }, [line, open]);

  const parsedNet = useMemo(() => {
    const cleaned = amountNet.trim().replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }, [amountNet]);

  const parsedVat = useMemo(() => parseFloat(vatRate) || 0, [vatRate]);

  const computedGross = useMemo(
    () => Math.round(parsedNet * (1 + parsedVat / 100) * 100) / 100,
    [parsedNet, parsedVat]
  );

  const annualInfo = ANNUAL_MULTIPLIER[recurrenceType];
  const annualTotal = Math.round(parsedNet * annualInfo.factor * 100) / 100;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome obbligatorio";
    if (!categoryLabel.trim()) errs.categoryLabel = "Categoria obbligatoria";
    if (parsedNet <= 0) errs.amountNet = "L'importo deve essere positivo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: name.trim(),
      categoryLabel: categoryLabel.trim(),
      amountNet: parsedNet,
      vatRate: parsedVat,
      recurrenceType,
      notes: notes.trim() || undefined,
    });
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border-card bg-bg-primary shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {line ? "Modifica Costo" : "Aggiungi Costo"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-btn p-1.5 text-text-dim hover:bg-white/[0.05] hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
              placeholder="es. Nuovo sistema POS"
              className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none ${
                errors.name ? "border-accent-red" : "border-border-card focus:border-accent-blue"
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-accent-red">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
              Categoria *
            </label>
            <input
              type="text"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder="es. Attrezzature, Marketing"
              className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none ${
                errors.categoryLabel ? "border-accent-red" : "border-border-card focus:border-accent-blue"
              }`}
            />
            {errors.categoryLabel && <p className="mt-1 text-[11px] text-accent-red">{errors.categoryLabel}</p>}
          </div>

          {/* Amount + VAT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Importo netto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-dim">&euro;</span>
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
              <select
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none"
              >
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gross calculation */}
          <div className="rounded-btn border border-border-card bg-white/[0.02] p-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">Totale lordo</span>
            <span className="font-mono text-sm font-semibold text-text-primary">
              {formatCurrency(computedGross)}
            </span>
          </div>

          {/* Recurrence */}
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

          {/* Annual total */}
          <div className="rounded-btn border border-accent-blue/20 bg-accent-blue/5 p-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Totale annuale ({formatCurrency(parsedNet)} x {annualInfo.label})
            </span>
            <span className="font-mono text-sm font-semibold text-accent-blue">
              {formatCurrency(annualTotal)}
            </span>
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
              placeholder="Note opzionali..."
              className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none resize-none"
            />
          </div>
        </form>

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
            {line ? "Aggiorna" : "Aggiungi costo"}
          </button>
        </div>
      </div>
    </>
  );
}
