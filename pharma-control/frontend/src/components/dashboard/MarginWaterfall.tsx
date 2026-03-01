import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatCompact, truncName } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

interface WaterfallBar {
  name: string;
  base: number;
  value: number;
  isTotal: boolean;
  isNegative: boolean;
}

function buildWaterfallData(sectors: SectorData[]): WaterfallBar[] {
  const withMargin = sectors
    .filter((s) => s.margine !== null && s.margine !== 0)
    .sort((a, b) => (b.margine ?? 0) - (a.margine ?? 0));

  let running = 0;
  const bars: WaterfallBar[] = [];

  for (const s of withMargin) {
    const margin = s.margine ?? 0;
    const isNeg = margin < 0;

    bars.push({
      name: truncName(s.tipologia, 16),
      base: isNeg ? running + margin : running,
      value: Math.abs(margin),
      isTotal: false,
      isNegative: isNeg,
    });

    running += margin;
  }

  // Total bar
  bars.push({
    name: "Totale",
    base: 0,
    value: Math.max(running, 0),
    isTotal: true,
    isNegative: running < 0,
  });

  return bars;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WaterfallBar }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  const actual = d.isNegative ? -d.value : d.value;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{d.name}</p>
      <p
        className="font-mono text-xs"
        style={{
          color: d.isTotal
            ? COLORS.accentBlue
            : d.isNegative
              ? COLORS.accentRed
              : COLORS.accentGreen,
        }}
      >
        {d.isTotal ? "Margine Totale: " : "Contributo: "}
        {formatCurrency(actual)}
      </p>
      {!d.isTotal && (
        <p className="font-mono text-[10px] text-text-dim">
          Cumulativo: {formatCurrency(d.base + (d.isNegative ? 0 : d.value))}
        </p>
      )}
    </div>
  );
}

export default function MarginWaterfall({ sectors }: Props) {
  const data = buildWaterfallData(sectors);

  if (data.length <= 1) {
    return (
      <p className="py-8 text-center text-sm text-text-dim">
        Nessun dato disponibile
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 32, 280)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
      >
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
          width={130}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <ReferenceLine x={0} stroke={COLORS.textDim} strokeDasharray="3 3" />

        {/* Invisible base */}
        <Bar dataKey="base" stackId="waterfall" fill="transparent" />

        {/* Visible value */}
        <Bar dataKey="value" stackId="waterfall" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.isTotal
                  ? COLORS.accentBlue
                  : entry.isNegative
                    ? COLORS.accentRed
                    : COLORS.accentGreen
              }
              fillOpacity={entry.isTotal ? 0.9 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
