import { useState, useRef, useCallback, useEffect } from "react";
import { Lock, Loader2, Check, Info } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import { updateRevenueLines } from "@/services/api";
import type { Budget, BudgetRevenueLine, BudgetSummary, AdjustmentMode } from "@/types";

interface RevenueTabProps {
  budget: Budget;
  onUpdate: (lines: BudgetRevenueLine[], summary: BudgetSummary) => void;
  locked: boolean;
}

type AdjustmentModeUI = "global" | "category";

const MODE_OPTIONS: { value: AdjustmentMode; label: string }[] = [
  { value: "NO_CHANGE", label: "Invariato" },
  { value: "PCT_CHANGE", label: "Variazione %" },
  { value: "ABSOLUTE", label: "Valore assoluto" },
];

export default function RevenueTab({ budget, onUpdate, locked }: RevenueTabProps) {
  const [mode, setMode] = useState<AdjustmentModeUI>(
    budget.globalAdjustmentPct != null ? "global" : "category"
  );
  const [globalPct, setGlobalPct] = useState(
    budget.globalAdjustmentPct?.toString() ?? "0"
  );
  const [lineEdits, setLineEdits] = useState<
    Record<string, { adjustmentMode: AdjustmentMode; value: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize line edits from budget data
  useEffect(() => {
    const edits: Record<string, { adjustmentMode: AdjustmentMode; value: string }> = {};
    for (const line of budget.revenueLines) {
      edits[line.id] = {
        adjustmentMode: line.adjustmentMode,
        value:
          line.adjustmentMode === "ABSOLUTE"
            ? (line.adjustmentAbsolute?.toString() ?? "")
            : (line.adjustmentPct?.toString() ?? "0"),
      };
    }
    setLineEdits(edits);
  }, [budget.revenueLines]);

  const showSavedBriefly = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  async function applyGlobal() {
    const pct = parseFloat(globalPct.replace(",", "."));
    if (isNaN(pct)) return;

    setSaving(true);
    try {
      const result = await updateRevenueLines(budget.id, {
        globalAdjustmentPct: pct,
      });
      onUpdate(result.revenueLines, result.summary);
      showSavedBriefly();
    } catch {
      // error handled by api client
    } finally {
      setSaving(false);
    }
  }

  function scheduleLineSave(lineId: string, adjMode: AdjustmentMode, rawValue: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const val = parseFloat(rawValue.replace(",", "."));

      setSaving(true);
      try {
        const result = await updateRevenueLines(budget.id, {
          globalAdjustmentPct: null,
          lines: budget.revenueLines.map((line) => {
            if (line.id === lineId) {
              return {
                id: line.id,
                adjustmentMode: adjMode,
                adjustmentPct: adjMode === "PCT_CHANGE" ? (isNaN(val) ? 0 : val) : undefined,
                adjustmentAbsolute: adjMode === "ABSOLUTE" ? (isNaN(val) ? 0 : val) : undefined,
              };
            }
            // Use current edit state for other lines
            const edit = lineEdits[line.id];
            if (!edit) {
              return {
                id: line.id,
                adjustmentMode: line.adjustmentMode,
                adjustmentPct: line.adjustmentPct,
                adjustmentAbsolute: line.adjustmentAbsolute,
              };
            }
            const editVal = parseFloat(edit.value.replace(",", "."));
            return {
              id: line.id,
              adjustmentMode: edit.adjustmentMode,
              adjustmentPct: edit.adjustmentMode === "PCT_CHANGE" ? (isNaN(editVal) ? 0 : editVal) : undefined,
              adjustmentAbsolute: edit.adjustmentMode === "ABSOLUTE" ? (isNaN(editVal) ? 0 : editVal) : undefined,
            };
          }),
        });
        onUpdate(result.revenueLines, result.summary);
        showSavedBriefly();
      } catch {
        // error handled by api client
      } finally {
        setSaving(false);
      }
    }, 500);
  }

  function handleLineChange(lineId: string, field: "adjustmentMode" | "value", newVal: string) {
    setLineEdits((prev) => {
      const current = prev[lineId] ?? { adjustmentMode: "NO_CHANGE", value: "0" };
      const updated = { ...current, [field]: newVal };

      // If mode changed to NO_CHANGE, clear value
      if (field === "adjustmentMode" && newVal === "NO_CHANGE") {
        updated.value = "0";
      }

      return { ...prev, [lineId]: updated };
    });

    // Auto-save on mode change
    if (field === "adjustmentMode") {
      const current = lineEdits[lineId];
      scheduleLineSave(lineId, newVal as AdjustmentMode, current?.value ?? "0");
    }
  }

  function handleLineBlur(lineId: string) {
    const edit = lineEdits[lineId];
    if (!edit) return;
    scheduleLineSave(lineId, edit.adjustmentMode, edit.value);
  }

  // Compute totals from current budget lines
  const totals = budget.revenueLines.reduce(
    (acc, l) => ({
      baselineRevenue: acc.baselineRevenue + l.baselineRevenue,
      forecastRevenue: acc.forecastRevenue + l.forecastRevenue,
      forecastCOGS: acc.forecastCOGS + l.forecastCOGS,
      forecastMargin: acc.forecastMargin + l.forecastMargin,
    }),
    { baselineRevenue: 0, forecastRevenue: 0, forecastCOGS: 0, forecastMargin: 0 }
  );

  const totalMarginPct = totals.forecastRevenue > 0
    ? (totals.forecastMargin / totals.forecastRevenue) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Manual baseline warning */}
      {budget.baselineSource === "MANUAL" && budget.revenueLines.length === 0 && (
        <div className="flex items-start gap-3 rounded-btn border border-accent-blue/30 bg-accent-blue/5 p-4">
          <Info className="h-4 w-4 mt-0.5 text-accent-blue shrink-0" />
          <p className="text-xs text-text-muted">
            Questo budget usa valori di base inseriti manualmente. Per una base automatica dai dati
            di vendita, crea un nuovo budget usando i report storici.
          </p>
        </div>
      )}

      {/* Adjustment mode selector */}
      {!locked && (
        <div className="rounded-btn border border-border-card bg-white/[0.02] p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">Modalità di rettifica:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="adjMode"
                checked={mode === "category"}
                onChange={() => setMode("category")}
                className="accent-accent-blue"
              />
              <span className="text-sm text-text-primary">Per categoria</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="adjMode"
                checked={mode === "global"}
                onChange={() => setMode("global")}
                className="accent-accent-blue"
              />
              <span className="text-sm text-text-primary">Globale (modo semplice)</span>
            </label>
          </div>

          {mode === "global" && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-text-dim">Applica una rettifica uniforme a tutte le categorie:</span>
              <div className="relative">
                <input
                  type="text"
                  value={globalPct}
                  onChange={(e) => setGlobalPct(e.target.value)}
                  className="w-24 rounded-btn border border-border-card bg-bg-card px-3 py-1.5 pr-7 text-sm font-mono text-text-primary focus:border-accent-blue focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim">%</span>
              </div>
              <button
                onClick={applyGlobal}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-btn bg-accent-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Applica a tutti
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save status indicator */}
      {(saving || saved) && (
        <div className="flex items-center gap-1.5 text-xs">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-accent-blue" />
              <span className="text-text-dim">Salvataggio...</span>
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-accent-green" />
              <span className="text-accent-green">Salvato</span>
            </>
          )}
        </div>
      )}

      {/* Revenue table */}
      {budget.revenueLines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-dim">
          <p className="text-sm">Nessuna riga di ricavo.</p>
          {budget.baselineSource === "MANUAL" && (
            <p className="text-xs mt-1">Le righe di ricavo saranno aggiunte in un prossimo aggiornamento.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-card text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">
                <th className="pb-2 pr-4">Categoria</th>
                <th className="pb-2 pr-4 text-right">Ricavo Base</th>
                <th className="pb-2 pr-4 text-right">
                  <span className="inline-flex items-center gap-1">
                    Margine % <Lock className="h-3 w-3" />
                  </span>
                </th>
                {!locked && mode === "category" && (
                  <th className="pb-2 pr-4">Rettifica</th>
                )}
                <th className="pb-2 pr-4 text-right">Ricavo Prev.</th>
                <th className="pb-2 pr-4 text-right">Costo Prev.</th>
                <th className="pb-2 pr-4 text-right">Margine Prev.</th>
                <th className="pb-2 text-right">Margine %</th>
              </tr>
            </thead>
            <tbody>
              {budget.revenueLines.map((line) => {
                const edit = lineEdits[line.id];
                const adjMode = edit?.adjustmentMode ?? line.adjustmentMode;
                const adjValue = edit?.value ?? "0";
                const inputDisabled = locked || mode === "global" || adjMode === "NO_CHANGE";

                return (
                  <tr key={line.id} className="border-b border-border-card/50 hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 text-text-primary font-medium">
                      {line.categoryLabel}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-text-dim">
                      {formatCurrency(line.baselineRevenue)}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span
                        className="inline-flex items-center gap-1 font-mono text-text-dim"
                        title="Il Margine % è bloccato ai dati storici"
                      >
                        <Lock className="h-3 w-3 text-text-dim/50" />
                        {formatPercent(line.baselineMarginPct)}
                      </span>
                    </td>
                    {!locked && mode === "category" && (
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={adjMode}
                            onChange={(e) => handleLineChange(line.id, "adjustmentMode", e.target.value)}
                            className="rounded-btn border border-border-card bg-bg-card px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                          >
                            {MODE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <div className="relative">
                            <input
                              type="text"
                              value={adjValue}
                              onChange={(e) => handleLineChange(line.id, "value", e.target.value)}
                              onBlur={() => handleLineBlur(line.id)}
                              disabled={inputDisabled}
                              className="w-20 rounded-btn border border-border-card bg-bg-card px-2 py-1 pr-6 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue disabled:opacity-40"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-dim">
                              {adjMode === "ABSOLUTE" ? "\u20AC" : "%"}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 pr-4 text-right font-mono font-semibold text-text-primary">
                      {formatCurrency(line.forecastRevenue)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-text-dim">
                      {formatCurrency(line.forecastCOGS)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono" style={{ color: COLORS.accentGreen }}>
                      {formatCurrency(line.forecastMargin)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-dim">
                      {formatPercent(line.baselineMarginPct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-card font-semibold">
                <td className="pt-3 pr-4 text-text-primary">TOTALE</td>
                <td className="pt-3 pr-4 text-right font-mono text-text-dim">
                  {formatCurrency(totals.baselineRevenue)}
                </td>
                <td className="pt-3 pr-4 text-right">
                  <Lock className="h-3 w-3 text-text-dim/50 inline" />
                </td>
                {!locked && mode === "category" && <td className="pt-3 pr-4">&mdash;</td>}
                <td className="pt-3 pr-4 text-right font-mono text-text-primary">
                  {formatCurrency(totals.forecastRevenue)}
                </td>
                <td className="pt-3 pr-4 text-right font-mono text-text-dim">
                  {formatCurrency(totals.forecastCOGS)}
                </td>
                <td className="pt-3 pr-4 text-right font-mono" style={{ color: COLORS.accentGreen }}>
                  {formatCurrency(totals.forecastMargin)}
                </td>
                <td className="pt-3 text-right font-mono text-text-dim">
                  {formatPercent(totalMarginPct)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
