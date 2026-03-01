"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { COLORS } from "@/lib/constants";
import { formatPercent, formatCurrency } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

interface BarEntry {
  name: string;
  marginePct: number;
  ricaricoPct: number | null;
  margine: number | null;
  fill: string;
}

function getTrafficLightColor(pct: number): string {
  if (pct > 40) return COLORS.accentGreen;
  if (pct >= 25) return COLORS.accentAmber;
  return COLORS.accentRed;
}

function truncName(name: string, max: number = 22): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BarEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{d.name}</p>
      <p className="font-mono text-xs" style={{ color: d.fill }}>
        Margine %: {formatPercent(d.marginePct)}
      </p>
      {d.ricaricoPct !== null && (
        <p className="font-mono text-xs text-text-muted">
          Ricarico %: {formatPercent(d.ricaricoPct)}
        </p>
      )}
      {d.margine !== null && (
        <p className="font-mono text-xs text-text-muted">
          Margine: {formatCurrency(d.margine)}
        </p>
      )}
    </div>
  );
}

export default function MarginBySectorChart({ sectors }: Props) {
  const data: BarEntry[] = sectors
    .filter(
      (s) =>
        s.valore > 500 && s.marginePct !== null && s.marginePct > -50
    )
    .sort((a, b) => (b.marginePct ?? 0) - (a.marginePct ?? 0))
    .map((s) => ({
      name: truncName(s.tipologia),
      marginePct: s.marginePct ?? 0,
      ricaricoPct: s.ricaricoPct,
      margine: s.margine,
      fill: getTrafficLightColor(s.marginePct ?? 0),
    }));

  const chartHeight = Math.max(data.length * 38 + 40, 200);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fill: COLORS.textDim, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, "auto"]}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fill: COLORS.textMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="marginePct" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
