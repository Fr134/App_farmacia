import { useState, useEffect } from "react";
import { X, Loader2, BarChart3, PenLine } from "lucide-react";
import { getReports } from "@/services/api";
import type { ReportSummary } from "@/types";

interface CreateBudgetModalProps {
  open: boolean;
  saving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    year: number;
    baselineSource: "HISTORICAL" | "MANUAL";
    baselineYear?: number;
    notes?: string;
  }) => void;
}

export default function CreateBudgetModal({
  open,
  saving,
  serverError,
  onClose,
  onSubmit,
}: CreateBudgetModalProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [baselineSource, setBaselineSource] = useState<"HISTORICAL" | "MANUAL">("HISTORICAL");
  const [baselineYear, setBaselineYear] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);

  useEffect(() => {
    if (!open) return;
    // Reset form
    setName("");
    setYear(new Date().getFullYear() + 1);
    setBaselineSource("HISTORICAL");
    setBaselineYear("");
    setNotes("");
    setErrors({});

    // Fetch available years from reports
    setLoadingYears(true);
    getReports()
      .then((reports: ReportSummary[]) => {
        const years = [...new Set(reports.map((r) => r.periodYear))].sort(
          (a, b) => b - a
        );
        setAvailableYears(years);
        if (years.length > 0) setBaselineYear(years[0]);
      })
      .catch(() => setAvailableYears([]))
      .finally(() => setLoadingYears(false));
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome obbligatorio";
    if (!year || year < 2000) errs.year = "Anno valido obbligatorio";
    if (baselineSource === "HISTORICAL" && !baselineYear) {
      errs.baselineYear = "Anno di riferimento obbligatorio";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      name: name.trim(),
      year,
      baselineSource,
      baselineYear: baselineSource === "HISTORICAL" ? (baselineYear as number) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-card border border-border-card bg-bg-primary shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
            <h2 className="text-base font-semibold text-text-primary">
              Nuovo Budget
            </h2>
            <button
              onClick={onClose}
              className="rounded-btn p-1.5 text-text-dim hover:bg-white/[0.05] hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Nome budget *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Budget 2026 - Scenario base"
                className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:outline-none ${
                  errors.name ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-accent-red">{errors.name}</p>}
            </div>

            {/* Year */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Anno *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                min={2000}
                max={2100}
                className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm font-mono text-text-primary focus:outline-none ${
                  errors.year ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                }`}
              />
              {errors.year && <p className="mt-1 text-[11px] text-accent-red">{errors.year}</p>}
            </div>

            {/* Baseline Source */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-2">
                Fonte dati base
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaselineSource("HISTORICAL")}
                  className={`flex flex-col items-center gap-2 rounded-btn border p-4 text-center transition-all ${
                    baselineSource === "HISTORICAL"
                      ? "border-accent-blue bg-accent-blue/10 text-text-primary"
                      : "border-border-card bg-bg-card text-text-muted hover:border-text-dim"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs font-medium">Da dati storici</span>
                  <span className="text-[10px] text-text-dim">Usa i report CSV caricati come base</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBaselineSource("MANUAL")}
                  className={`flex flex-col items-center gap-2 rounded-btn border p-4 text-center transition-all ${
                    baselineSource === "MANUAL"
                      ? "border-accent-blue bg-accent-blue/10 text-text-primary"
                      : "border-border-card bg-bg-card text-text-muted hover:border-text-dim"
                  }`}
                >
                  <PenLine className="h-5 w-5" />
                  <span className="text-xs font-medium">Inserimento manuale</span>
                  <span className="text-[10px] text-text-dim">Inserisci i valori manualmente</span>
                </button>
              </div>
            </div>

            {/* Reference Year (only if HISTORICAL) */}
            {baselineSource === "HISTORICAL" && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                  Anno di riferimento *
                </label>
                {loadingYears ? (
                  <div className="flex items-center gap-2 text-xs text-text-dim py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Caricamento anni disponibili...
                  </div>
                ) : availableYears.length === 0 ? (
                  <div className="rounded-btn border border-accent-amber/30 bg-accent-amber/5 p-3 text-xs text-accent-amber">
                    Nessun dato di vendita. Carica prima un report dalla Dashboard.
                  </div>
                ) : (
                  <>
                    <select
                      value={baselineYear}
                      onChange={(e) => setBaselineYear(parseInt(e.target.value))}
                      className={`w-full rounded-btn border bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none ${
                        errors.baselineYear ? "border-accent-red" : "border-border-card focus:border-accent-blue"
                      }`}
                    >
                      <option value="">Seleziona anno</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {errors.baselineYear && (
                      <p className="mt-1 text-[11px] text-accent-red">{errors.baselineYear}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-text-dim mb-1.5">
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Note opzionali..."
                className="w-full rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none resize-none"
              />
            </div>
          </form>

          {/* Server error */}
          {serverError && (
            <div className="mx-6 mb-0 rounded-btn border border-accent-red/30 bg-accent-red/5 p-3 text-xs text-accent-red">
              {serverError}
            </div>
          )}

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
              disabled={saving || (baselineSource === "HISTORICAL" && availableYears.length === 0)}
              className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crea budget
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
