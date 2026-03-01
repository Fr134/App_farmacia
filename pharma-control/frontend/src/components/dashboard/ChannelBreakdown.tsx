import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileText, ShoppingCart, CreditCard } from "lucide-react";
import { COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatPercent,
  formatInteger,
  truncName,
} from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

const CHANNEL_COLORS = {
  ricetta: COLORS.accentBlue,
  libera: COLORS.accentPurple,
  fidelity: COLORS.accentCyan,
} as const;

interface ChannelTotals {
  valore: number;
  pezzi: number;
  pct: number;
}

interface StackedBarEntry {
  name: string;
  ricetta: number;
  libera: number;
  fidelity: number;
}

interface DonutEntry {
  name: string;
  value: number;
  pct: number;
  color: string;
}

function computeChannelTotals(sectors: SectorData[]): {
  ricetta: ChannelTotals;
  libera: ChannelTotals;
  fidelity: ChannelTotals;
  totalRevenue: number;
} {
  let totRicetta = 0;
  let totLibera = 0;
  let totFidelity = 0;
  let pezziRicetta = 0;
  let pezziLibera = 0;
  let pezziFidelity = 0;

  for (const s of sectors) {
    totRicetta += s.valoreRicetta ?? 0;
    totLibera += s.valoreLibera ?? 0;
    totFidelity += s.valoreFidelity ?? 0;
    pezziRicetta += s.pezziRicetta ?? 0;
    pezziLibera += s.pezziLibera ?? 0;
    pezziFidelity += s.pezziFidelity ?? 0;
  }

  const totalRevenue = totRicetta + totLibera + totFidelity;

  return {
    ricetta: {
      valore: totRicetta,
      pezzi: pezziRicetta,
      pct: totalRevenue > 0 ? (totRicetta / totalRevenue) * 100 : 0,
    },
    libera: {
      valore: totLibera,
      pezzi: pezziLibera,
      pct: totalRevenue > 0 ? (totLibera / totalRevenue) * 100 : 0,
    },
    fidelity: {
      valore: totFidelity,
      pezzi: pezziFidelity,
      pct: totalRevenue > 0 ? (totFidelity / totalRevenue) * 100 : 0,
    },
    totalRevenue,
  };
}

function StackedTooltip({
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
        <p key={entry.name} className="font-mono text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DonutEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{d.name}</p>
      <p className="font-mono text-xs text-text-muted">
        {formatCurrency(d.value)} ({formatPercent(d.pct)})
      </p>
    </div>
  );
}

export default function ChannelBreakdown({ sectors }: Props) {
  const { ricetta, libera, fidelity, totalRevenue } = computeChannelTotals(sectors);

  // Top 5 sectors by valore for stacked bar chart
  const top5 = [...sectors]
    .sort((a, b) => b.valore - a.valore)
    .slice(0, 5);

  const stackedData: StackedBarEntry[] = top5.map((s) => ({
    name: truncName(s.tipologia, 18),
    ricetta: s.valoreRicetta ?? 0,
    libera: s.valoreLibera ?? 0,
    fidelity: s.valoreFidelity ?? 0,
  }));

  // Donut data
  const donutData: DonutEntry[] = [
    { name: "Ricetta", value: ricetta.valore, pct: ricetta.pct, color: CHANNEL_COLORS.ricetta },
    { name: "Vendita Libera", value: libera.valore, pct: libera.pct, color: CHANNEL_COLORS.libera },
    { name: "Fidelity", value: fidelity.valore, pct: fidelity.pct, color: CHANNEL_COLORS.fidelity },
  ].filter((d) => d.value > 0);

  const kpiCards = [
    {
      label: "Ricetta",
      icon: FileText,
      color: CHANNEL_COLORS.ricetta,
      valore: ricetta.valore,
      pezzi: ricetta.pezzi,
      pct: ricetta.pct,
    },
    {
      label: "Vendita Libera",
      icon: ShoppingCart,
      color: CHANNEL_COLORS.libera,
      valore: libera.valore,
      pezzi: libera.pezzi,
      pct: libera.pct,
    },
    {
      label: "Fidelity",
      icon: CreditCard,
      color: CHANNEL_COLORS.fidelity,
      valore: fidelity.valore,
      pezzi: fidelity.pezzi,
      pct: fidelity.pct,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 3 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ backgroundColor: card.color }}
            />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-4 w-4" style={{ color: card.color }} />
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  {card.label}
                </span>
              </div>
              <p className="font-mono text-xl font-bold text-text-primary">
                {formatCurrency(card.valore)}
              </p>
              <p className="mt-1 text-[11px] text-text-dim">
                {formatInteger(card.pezzi)} pezzi &middot; {formatPercent(card.pct)} del totale
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row: Stacked bar + Donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stacked bar chart - Top 5 sectors by channel */}
        <div>
          <p className="mb-3 text-xs font-medium text-text-muted">
            Top 5 Settori &mdash; Ripartizione per Canale
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={stackedData}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                tick={{ fill: COLORS.textDim, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<StackedTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="ricetta" name="Ricetta" stackId="channel" fill={CHANNEL_COLORS.ricetta} radius={[0, 0, 0, 0]} barSize={18} />
              <Bar dataKey="libera" name="Vendita Libera" stackId="channel" fill={CHANNEL_COLORS.libera} radius={[0, 0, 0, 0]} barSize={18} />
              <Bar dataKey="fidelity" name="Fidelity" stackId="channel" fill={CHANNEL_COLORS.fidelity} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart - Overall channel distribution */}
        <div>
          <p className="mb-3 text-xs font-medium text-text-muted">
            Distribuzione per Canale
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-[200px] w-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs text-text-muted">{d.name}</span>
                  <span className="ml-auto flex-shrink-0 font-mono text-xs text-text-primary">
                    {formatPercent(d.pct)}
                  </span>
                </div>
              ))}
              <div className="mt-1 border-t border-border-card pt-2">
                <span className="text-[10px] text-text-dim">
                  Totale canali: {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
