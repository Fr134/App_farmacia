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
  comparisonSectors?: SectorData[];
}

function truncName(name: string, max: number = 18): string {
  return name.length > max ? name.slice(0, max) + "\u2026" : name;
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

export default function Top5CostMarginChart({ sectors, comparisonSectors }: Props) {
  const top5 = [...sectors]
    .sort((a, b) => b.valore - a.valore)
    .slice(0, 5);

  const compMap = new Map(
    (comparisonSectors ?? []).map((s) => [s.tipologia, s])
  );

  const data = top5.map((s) => {
    const comp = compMap.get(s.tipologia);
    return {
      name: truncName(s.tipologia),
      "Costo Venduto": s.costoVenduto ?? 0,
      Margine: s.margine ?? 0,
      ...(comp
        ? {
            "Costo Venduto (prec.)": comp.costoVenduto ?? 0,
            "Margine (prec.)": comp.margine ?? 0,
          }
        : {}),
    };
  });

  const hasComparison = comparisonSectors && comparisonSectors.length > 0;

  return (
    <ResponsiveContainer width="100%" height={hasComparison ? 300 : 260}>
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
          stackId="current"
          fill={COLORS.accentAmber}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Margine"
          stackId="current"
          fill={COLORS.accentGreen}
          radius={[0, 4, 4, 0]}
        />
        {hasComparison && (
          <Bar
            dataKey="Costo Venduto (prec.)"
            stackId="prev"
            fill={COLORS.accentAmber}
            opacity={0.3}
            radius={[0, 0, 0, 0]}
          />
        )}
        {hasComparison && (
          <Bar
            dataKey="Margine (prec.)"
            stackId="prev"
            fill={COLORS.accentGreen}
            opacity={0.3}
            radius={[0, 4, 4, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
