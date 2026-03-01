"use client";

import { useReports } from "@/hooks/use-reports";
import { MESI_DISPLAY } from "@/lib/constants";

interface PeriodSelectorProps {
  currentMonth: number;
  currentYear: number;
  onSelect: (reportId: string) => void;
}

export default function PeriodSelector({
  currentMonth,
  currentYear,
  onSelect,
}: PeriodSelectorProps) {
  const { reports, loading } = useReports();

  if (loading || reports.length === 0) return null;

  const currentValue =
    reports.find(
      (r) => r.periodMonth === currentMonth && r.periodYear === currentYear
    )?.id ?? reports[0]?.id ?? "";

  return (
    <select
      value={currentValue}
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
      }}
      className="rounded-btn border border-border-card bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
    >
      {reports.map((r) => (
        <option key={r.id} value={r.id}>
          {MESI_DISPLAY[r.periodMonth]} {r.periodYear}
        </option>
      ))}
    </select>
  );
}
