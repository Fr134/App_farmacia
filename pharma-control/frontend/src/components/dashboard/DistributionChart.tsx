import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
  comparisonSectors?: SectorData[];
}

type Mode = "venduto" | "margine";

interface SliceData {
  name: string;
  value: number;
  pct: number;
}

function prepareData(sectors: SectorData[], mode: Mode): SliceData[] {
  const key = mode === "venduto" ? "valore" : "margine";
  const sorted = [...sectors]
    .filter((s) => (s[key] ?? 0) > 0)
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));

  const total = sorted.reduce((sum, s) => sum + (s[key] ?? 0), 0);
  const top5 = sorted.slice(0, 5);
  const restSum = sorted.slice(5).reduce((sum, s) => sum + (s[key] ?? 0), 0);

  const slices: SliceData[] = top5.map((s) => ({
    name: s.tipologia,
    value: s[key] ?? 0,
    pct: total > 0 ? ((s[key] ?? 0) / total) * 100 : 0,
  }));

  if (restSum > 0) {
    slices.push({
      name: "Altri",
      value: restSum,
      pct: total > 0 ? (restSum / total) * 100 : 0,
    });
  }

  return slices;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SliceData & { ring?: string }; color: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">
        {d.name}
        {d.ring && (
          <span className="ml-1 text-text-dim">({d.ring})</span>
        )}
      </p>
      <p className="font-mono text-xs text-text-muted">
        {formatCurrency(d.value)} ({formatPercent(d.pct)})
      </p>
    </div>
  );
}

export default function DistributionChart({ sectors, comparisonSectors }: Props) {
  const [mode, setMode] = useState<Mode>("venduto");
  const data = prepareData(sectors, mode);
  const hasComparison = comparisonSectors && comparisonSectors.length > 0;
  const compData = hasComparison ? prepareData(comparisonSectors, mode) : [];

  // Tag slices for tooltip identification
  const outerData = data.map((d) => ({ ...d, ring: hasComparison ? "corrente" : undefined }));
  const innerData = compData.map((d) => ({ ...d, ring: "precedente" }));

  return (
    <div>
      {/* Toggle */}
      <div className="mb-4 flex gap-1 rounded-btn bg-white/[0.03] p-1 w-fit">
        {(["venduto", "margine"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-[6px] px-3 py-1 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-accent-blue text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {m === "venduto" ? "Venduto" : "Margine"}
          </button>
        ))}
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-[200px] h-[200px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Inner ring (previous period) — only in comparison mode */}
              {hasComparison && (
                <Pie
                  data={innerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {innerData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="transparent"
                      opacity={0.4}
                    />
                  ))}
                </Pie>
              )}

              {/* Outer ring (current period) */}
              <Pie
                data={outerData}
                cx="50%"
                cy="50%"
                innerRadius={hasComparison ? 58 : 55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {outerData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="truncate text-xs text-text-muted">
                {d.name}
              </span>
              <span className="ml-auto flex-shrink-0 font-mono text-xs text-text-primary">
                {formatPercent(d.pct)}
              </span>
            </div>
          ))}
          {hasComparison && (
            <div className="mt-1 flex items-center gap-2 border-t border-border-card pt-2">
              <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-white/20" />
              <span className="text-[10px] text-text-dim">
                Anello interno = periodo precedente
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
