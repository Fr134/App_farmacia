import { useReports } from "@/hooks/useReports";
import { MESI_DISPLAY } from "@/lib/constants";

interface PeriodSelectorProps {
  currentMonth: number;
  currentYear: number;
  onSelect: (reportId: string) => void;
  excludeId?: string;
  placeholder?: string;
}

export default function PeriodSelector({
  currentMonth,
  currentYear,
  onSelect,
  excludeId,
  placeholder,
}: PeriodSelectorProps) {
  const { reports, loading } = useReports();

  if (loading || reports.length === 0) return null;

  const filtered = excludeId
    ? reports.filter((r) => r.id !== excludeId)
    : reports;

  const currentValue = placeholder
    ? ""
    : filtered.find(
        (r) => r.periodMonth === currentMonth && r.periodYear === currentYear
      )?.id ?? filtered[0]?.id ?? "";

  return (
    <select
      value={currentValue}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {filtered.map((r) => (
        <option key={r.id} value={r.id}>
          {MESI_DISPLAY[r.periodMonth]} {r.periodYear}
        </option>
      ))}
    </select>
  );
}
