import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent, formatInteger } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

interface TreeNode {
  name: string;
  size: number;
  marginPct: number;
  margin: number;
  pieces: number;
}

function marginToColor(marginPct: number): string {
  if (marginPct < 0) return COLORS.accentRed;
  if (marginPct < 15) return "#F87171"; // light red
  if (marginPct < 25) return COLORS.accentAmber;
  if (marginPct < 35) return "#34D399"; // light green
  return COLORS.accentGreen;
}

function CustomContent({
  x,
  y,
  width,
  height,
  name,
  marginPct,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  marginPct?: number;
}) {
  if (width < 4 || height < 4) return null;

  const fill = marginToColor(marginPct ?? 0);
  const showLabel = width > 50 && height > 30;
  const showPct = width > 60 && height > 45;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        fillOpacity={0.75}
        stroke={COLORS.bgPrimary}
        strokeWidth={2}
      />
      {showLabel && name && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showPct ? -6 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fill={COLORS.textPrimary}
          fontSize={width > 100 ? 12 : 10}
          fontWeight={600}
        >
          {name.length > Math.floor(width / 7)
            ? name.slice(0, Math.floor(width / 7)) + "\u2026"
            : name}
        </text>
      )}
      {showPct && marginPct != null && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
          fontFamily="JetBrains Mono, monospace"
        >
          {formatPercent(marginPct)}
        </text>
      )}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TreeNode }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{d.name}</p>
      <div className="space-y-0.5">
        <p className="font-mono text-xs text-text-muted">
          Venduto: {formatCurrency(d.size)}
        </p>
        <p className="font-mono text-xs" style={{ color: COLORS.accentGreen }}>
          Margine: {formatCurrency(d.margin)}
        </p>
        <p className="font-mono text-xs" style={{ color: COLORS.accentPurple }}>
          Margine %: {formatPercent(d.marginPct)}
        </p>
        <p className="font-mono text-xs text-text-dim">
          Pezzi: {formatInteger(d.pieces)}
        </p>
      </div>
    </div>
  );
}

export default function RevenueTreemap({ sectors }: Props) {
  const data: TreeNode[] = sectors
    .filter((s) => s.valore > 0)
    .sort((a, b) => b.valore - a.valore)
    .map((s) => ({
      name: s.tipologia,
      size: s.valore,
      marginPct: s.marginePct ?? 0,
      margin: s.margine ?? 0,
      pieces: s.pezzi,
    }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-dim">
        Nessun dato disponibile
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomContent x={0} y={0} width={0} height={0} />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>

      {/* Color legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {[
          { color: COLORS.accentRed, label: "< 0%" },
          { color: "#F87171", label: "0-15%" },
          { color: COLORS.accentAmber, label: "15-25%" },
          { color: "#34D399", label: "25-35%" },
          { color: COLORS.accentGreen, label: "> 35%" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-4 rounded-sm"
              style={{ backgroundColor: color, opacity: 0.75 }}
            />
            <span className="text-[10px] text-text-dim">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-text-dim ml-2">
          Colore = Margine %
        </span>
      </div>
    </div>
  );
}
