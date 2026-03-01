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
import { formatPercent, formatCurrency, truncName } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
  comparisonSectors?: SectorData[];
}

interface BarEntry {
  name: string;
  marginePct: number;
  ricaricoPct: number | null;
  margine: number | null;
  valore: number;
  valorePct: number | null;
  rank: number;
  fill: string;
  "marginePct (prec.)"?: number;
}

function getTrafficLightColor(pct: number): string {
  if (pct > 40) return COLORS.accentGreen;
  if (pct >= 25) return COLORS.accentAmber;
  return COLORS.accentRed;
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
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg min-w-[160px]">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-xs font-medium text-text-primary">{d.name}</p>
        <span className="flex-shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-text-dim">
          #{d.rank}
        </span>
      </div>
      <div className="space-y-0.5">
        <p className="font-mono text-xs text-text-muted">
          Valore: {formatCurrency(d.valore)}
          {d.valorePct !== null && (
            <span className="text-text-dim"> ({formatPercent(d.valorePct)})</span>
          )}
        </p>
        {d.margine !== null && (
          <p className="font-mono text-xs" style={{ color: COLORS.accentGreen }}>
            Margine: {formatCurrency(d.margine)}
          </p>
        )}
        <p className="font-mono text-xs font-medium" style={{ color: d.fill }}>
          Margine %: {formatPercent(d.marginePct)}
        </p>
        {d.ricaricoPct !== null && (
          <p className="font-mono text-xs text-text-dim">
            Ricarico %: {formatPercent(d.ricaricoPct)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MarginBySectorChart({ sectors, comparisonSectors }: Props) {
  const compMap = new Map(
    (comparisonSectors ?? []).map((s) => [s.tipologia, s])
  );

  const hasComparison = comparisonSectors && comparisonSectors.length > 0;

  // Rank by valore for tooltip display
  const rankedByValore = [...sectors].sort((a, b) => b.valore - a.valore);
  const rankMap = new Map(rankedByValore.map((s, i) => [s.tipologia, i + 1]));

  const data: BarEntry[] = sectors
    .filter(
      (s) =>
        s.valore > 500 && s.marginePct !== null && s.marginePct > -50
    )
    .sort((a, b) => (b.marginePct ?? 0) - (a.marginePct ?? 0))
    .map((s) => {
      const comp = compMap.get(s.tipologia);
      return {
        name: truncName(s.tipologia),
        marginePct: s.marginePct ?? 0,
        ricaricoPct: s.ricaricoPct,
        margine: s.margine,
        valore: s.valore,
        valorePct: s.valorePct,
        rank: rankMap.get(s.tipologia) ?? 0,
        fill: getTrafficLightColor(s.marginePct ?? 0),
        ...(comp ? { "marginePct (prec.)": comp.marginePct ?? 0 } : {}),
      };
    });

  const barSize = hasComparison ? 14 : 20;
  const rowHeight = hasComparison ? 44 : 38;
  const chartHeight = Math.max(data.length * rowHeight + 40, 200);

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
        <Bar dataKey="marginePct" radius={[0, 4, 4, 0]} barSize={barSize}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
        {hasComparison && (
          <Bar
            dataKey="marginePct (prec.)"
            radius={[0, 4, 4, 0]}
            barSize={barSize}
            fill={COLORS.textDim}
            opacity={0.3}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
