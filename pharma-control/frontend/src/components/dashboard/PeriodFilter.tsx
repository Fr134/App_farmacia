import { useReports } from "@/hooks/useReports";
import { MESI_DISPLAY } from "@/lib/constants";
import type { ReportSummary } from "@/types";

export type FilterMode = "single" | "compare" | "range";

export interface PeriodFilterState {
  mode: FilterMode;
  currentId: string | null;
  comparisonId: string | null;
  rangeFrom: string | null; // YYYY-MM
  rangeTo: string | null;   // YYYY-MM
}

interface PeriodFilterProps {
  state: PeriodFilterState;
  onChange: (state: PeriodFilterState) => void;
}

function reportLabel(r: ReportSummary): string {
  return `${MESI_DISPLAY[r.periodMonth]} ${r.periodYear}`;
}

function reportToYYYYMM(r: ReportSummary): string {
  return `${r.periodYear}-${String(r.periodMonth).padStart(2, "0")}`;
}

/** Unique YYYY-MM options derived from available reports */
function getMonthOptions(reports: ReportSummary[]): { label: string; value: string }[] {
  return reports.map((r) => ({
    label: reportLabel(r),
    value: reportToYYYYMM(r),
  }));
}

type UIMode = "single" | "range";

function toUIMode(mode: FilterMode): UIMode {
  return mode === "range" ? "range" : "single";
}

export default function PeriodFilter({ state, onChange }: PeriodFilterProps) {
  const { reports, loading } = useReports();

  if (loading || reports.length === 0) return null;

  const uiMode = toUIMode(state.mode);
  const monthOptions = getMonthOptions(reports);

  // Sorted ascending for computing presets (reports are sorted newest-first)
  const sortedAsc = [...reports].reverse();
  const newest = reports[0];
  const oldest = sortedAsc[0];

  function handleUIModeChange(newUIMode: UIMode) {
    if (newUIMode === uiMode) return;

    if (newUIMode === "single") {
      onChange({
        mode: "single",
        currentId: state.currentId ?? reports[0]?.id ?? null,
        comparisonId: null,
        rangeFrom: null,
        rangeTo: null,
      });
    } else {
      // range — default to all data
      onChange({
        mode: "range",
        currentId: null,
        comparisonId: null,
        rangeFrom: oldest ? reportToYYYYMM(oldest) : null,
        rangeTo: newest ? reportToYYYYMM(newest) : null,
      });
    }
  }

  /** Compute preset ranges based on available data */
  function applyPreset(preset: string) {
    if (!newest) return;
    const newestYM = reportToYYYYMM(newest);
    let fromYM: string;

    if (preset === "trimestre") {
      // 3 months back from newest
      const d = new Date(newest.periodYear, newest.periodMonth - 1 - 2, 1);
      fromYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (preset === "semestre") {
      // 6 months back from newest
      const d = new Date(newest.periodYear, newest.periodMonth - 1 - 5, 1);
      fromYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (preset === "anno") {
      // Current year of newest report
      fromYM = `${newest.periodYear}-01`;
    } else {
      // all — oldest to newest
      fromYM = oldest ? reportToYYYYMM(oldest) : newestYM;
    }

    // Clamp to available data range
    const oldestYM = oldest ? reportToYYYYMM(oldest) : newestYM;
    if (fromYM < oldestYM) fromYM = oldestYM;

    onChange({
      mode: "range",
      currentId: null,
      comparisonId: null,
      rangeFrom: fromYM,
      rangeTo: newestYM,
    });
  }

  const presets = [
    { key: "trimestre", label: "Ultimo trimestre" },
    { key: "semestre", label: "Ultimo semestre" },
    { key: "anno", label: "Anno corrente" },
    { key: "tutti", label: "Tutti i dati" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-btn bg-white/[0.03] p-1">
          {([
            { key: "single" as UIMode, label: "Mese singolo" },
            { key: "range" as UIMode, label: "Periodo personalizzato" },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => handleUIModeChange(m.key)}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                uiMode === m.key
                  ? "bg-accent-blue text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        {uiMode === "single" && (
          <ReportDropdown
            reports={reports}
            value={state.currentId}
            onChange={(id) =>
              onChange({ ...state, currentId: id })
            }
          />
        )}

        {uiMode === "range" && (
          <div className="flex items-center gap-2">
            <MonthDropdown
              options={monthOptions}
              value={state.rangeFrom}
              onChange={(v) =>
                onChange({ ...state, rangeFrom: v })
              }
              label="Da"
            />
            <span className="text-xs text-text-dim">&rarr;</span>
            <MonthDropdown
              options={monthOptions}
              value={state.rangeTo}
              onChange={(v) =>
                onChange({ ...state, rangeTo: v })
              }
              label="A"
            />
          </div>
        )}
      </div>

      {/* Quick presets — only in range mode */}
      {uiMode === "range" && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="rounded-btn border border-border-card bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-text-muted hover:border-accent-blue/40 hover:text-text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function ReportDropdown({
  reports,
  value,
  onChange,
  excludeId,
  label,
}: {
  reports: ReportSummary[];
  value: string | null;
  onChange: (id: string) => void;
  excludeId?: string | null;
  label?: string;
}) {
  const filtered = excludeId
    ? reports.filter((r) => r.id !== excludeId)
    : reports;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      title={label}
      className="rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
    >
      {label && !value && (
        <option value="" disabled>
          {label}
        </option>
      )}
      {filtered.map((r) => (
        <option key={r.id} value={r.id}>
          {reportLabel(r)}
        </option>
      ))}
    </select>
  );
}

function MonthDropdown({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      title={label}
      className="rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
    >
      {label && !value && (
        <option value="" disabled>
          {label}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
