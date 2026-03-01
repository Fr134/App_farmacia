"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { COLORS, MESI_DISPLAY } from "@/lib/constants";
import { formatCurrency, formatInteger, formatChange } from "@/lib/formatters";
import type { ReportWithSectors } from "@/types";

interface ComparisonSummaryProps {
  current: ReportWithSectors;
  comparison: ReportWithSectors;
}

interface DeltaMetric {
  label: string;
  currentValue: string;
  previousValue: string;
  delta: number;
  deltaDisplay: string;
  unit: "pct" | "pp";
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 0) return <ArrowUpRight className="h-4 w-4" style={{ color: COLORS.accentGreen }} />;
  if (delta < 0) return <ArrowDownRight className="h-4 w-4" style={{ color: COLORS.accentRed }} />;
  return <Minus className="h-4 w-4" style={{ color: COLORS.textDim }} />;
}

function deltaColor(delta: number): string {
  if (delta > 0) return COLORS.accentGreen;
  if (delta < 0) return COLORS.accentRed;
  return COLORS.textDim;
}

export default function ComparisonSummary({ current, comparison }: ComparisonSummaryProps) {
  const currentLabel = `${MESI_DISPLAY[current.periodMonth]} ${current.periodYear}`;
  const compLabel = `${MESI_DISPLAY[comparison.periodMonth]} ${comparison.periodYear}`;

  const metrics: DeltaMetric[] = [
    {
      label: "Transato Lordo",
      currentValue: formatCurrency(current.totalRevenueGross),
      previousValue: formatCurrency(comparison.totalRevenueGross),
      delta: pctChange(current.totalRevenueGross, comparison.totalRevenueGross),
      deltaDisplay: formatChange(pctChange(current.totalRevenueGross, comparison.totalRevenueGross)),
      unit: "pct",
    },
    {
      label: "Margine Lordo",
      currentValue: formatCurrency(current.totalMargin),
      previousValue: formatCurrency(comparison.totalMargin),
      delta: pctChange(current.totalMargin, comparison.totalMargin),
      deltaDisplay: formatChange(pctChange(current.totalMargin, comparison.totalMargin)),
      unit: "pct",
    },
    {
      label: "Pezzi Venduti",
      currentValue: formatInteger(current.totalPieces),
      previousValue: formatInteger(comparison.totalPieces),
      delta: pctChange(current.totalPieces, comparison.totalPieces),
      deltaDisplay: formatChange(pctChange(current.totalPieces, comparison.totalPieces)),
      unit: "pct",
    },
    {
      label: "Margine %",
      currentValue: `${current.totalMarginPct.toFixed(2).replace(".", ",")}%`,
      previousValue: `${comparison.totalMarginPct.toFixed(2).replace(".", ",")}%`,
      delta: current.totalMarginPct - comparison.totalMarginPct,
      deltaDisplay: `${(current.totalMarginPct - comparison.totalMarginPct) > 0 ? "+" : ""}${(current.totalMarginPct - comparison.totalMarginPct).toFixed(2).replace(".", ",")} pp`,
      unit: "pp",
    },
  ];

  return (
    <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: COLORS.accentCyan }} />
      <div className="p-5">
        <h3 className="mb-4 text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
          Confronto: {currentLabel} vs {compLabel}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-dim">
                {m.label}
              </p>
              <div className="flex items-center gap-2">
                <DeltaIcon delta={m.delta} />
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: deltaColor(m.delta) }}
                >
                  {m.deltaDisplay}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-text-primary">{m.currentValue}</span>
                <span className="text-text-dim">vs</span>
                <span className="font-mono text-text-dim">{m.previousValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
