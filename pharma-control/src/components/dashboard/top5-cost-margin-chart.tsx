"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatCompact } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

function truncName(name: string, max: number = 18): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="font-mono text-xs"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function Top5CostMarginChart({ sectors }: Props) {
  const data = [...sectors]
    .sort((a, b) => b.valore - a.valore)
    .slice(0, 5)
    .map((s) => ({
      name: truncName(s.tipologia),
      "Costo Venduto": s.costoVenduto ?? 0,
      Margine: s.margine ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatCompact(v)}
          tick={{ fill: COLORS.textDim, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: COLORS.textMuted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: COLORS.textMuted, paddingTop: 8 }}
        />
        <Bar
          dataKey="Costo Venduto"
          stackId="a"
          fill={COLORS.accentAmber}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Margine"
          stackId="a"
          fill={COLORS.accentGreen}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
