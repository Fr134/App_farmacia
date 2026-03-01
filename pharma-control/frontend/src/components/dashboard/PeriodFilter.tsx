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

export default function PeriodFilter({ state, onChange }: PeriodFilterProps) {
  const { reports, loading } = useReports();

  if (loading || reports.length === 0) return null;

  const modes: { key: FilterMode; label: string }[] = [
    { key: "single", label: "Singolo" },
    { key: "compare", label: "Confronto" },
    { key: "range", label: "Range" },
  ];

  function handleModeChange(mode: FilterMode) {
    if (mode === state.mode) return;

    if (mode === "single") {
      onChange({
        mode,
        currentId: state.currentId ?? reports[0]?.id ?? null,
        comparisonId: null,
        rangeFrom: null,
        rangeTo: null,
      });
    } else if (mode === "compare") {
      onChange({
        mode,
        currentId: state.currentId ?? reports[0]?.id ?? null,
        comparisonId: reports.length > 1 ? reports[1].id : null,
        rangeFrom: null,
        rangeTo: null,
      });
    } else {
      // range
      const oldest = reports[reports.length - 1];
      const newest = reports[0];
      onChange({
        mode,
        currentId: null,
        comparisonId: null,
        rangeFrom: oldest ? reportToYYYYMM(oldest) : null,
        rangeTo: newest ? reportToYYYYMM(newest) : null,
      });
    }
  }

  const monthOptions = getMonthOptions(reports);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-btn bg-white/[0.03] p-1">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key)}
            className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
              state.mode === m.key
                ? "bg-accent-blue text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Dropdowns based on mode */}
      <div className="flex items-center gap-2">
        {state.mode === "single" && (
          <ReportDropdown
            reports={reports}
            value={state.currentId}
            onChange={(id) =>
              onChange({ ...state, currentId: id })
            }
          />
        )}

        {state.mode === "compare" && (
          <>
            <ReportDropdown
              reports={reports}
              value={state.currentId}
              onChange={(id) =>
                onChange({ ...state, currentId: id })
              }
              label="Corrente"
            />
            <span className="text-xs text-text-dim">vs</span>
            <ReportDropdown
              reports={reports}
              value={state.comparisonId}
              onChange={(id) =>
                onChange({ ...state, comparisonId: id })
              }
              excludeId={state.currentId}
              label="Precedente"
            />
          </>
        )}

        {state.mode === "range" && (
          <>
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
          </>
        )}
      </div>
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
