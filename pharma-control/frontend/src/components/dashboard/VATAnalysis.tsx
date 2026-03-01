import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Receipt, Landmark } from "lucide-react";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent, truncName } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

interface IvaBarEntry {
  name: string;
  iva: number;
  imponibile: number;
}

function IvaTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IvaBarEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-btn border border-border-card bg-bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text-primary">{d.name}</p>
      <p className="font-mono text-xs text-text-muted">
        IVA: {formatCurrency(d.iva)}
      </p>
      <p className="font-mono text-xs text-text-muted">
        Imponibile: {formatCurrency(d.imponibile)}
      </p>
    </div>
  );
}

export default function VATAnalysis({ sectors }: Props) {
  // Compute totals
  let totalImponibile = 0;
  let totalIva = 0;

  for (const s of sectors) {
    totalImponibile += s.imponibile ?? 0;
    totalIva += s.iva ?? 0;
  }

  const effectiveVatRate = totalImponibile > 0 ? (totalIva / totalImponibile) * 100 : 0;

  // Top 8 sectors by IVA amount
  const ivaData: IvaBarEntry[] = [...sectors]
    .filter((s) => (s.iva ?? 0) > 0)
    .sort((a, b) => (b.iva ?? 0) - (a.iva ?? 0))
    .slice(0, 8)
    .map((s) => ({
      name: truncName(s.tipologia, 18),
      iva: s.iva ?? 0,
      imponibile: s.imponibile ?? 0,
    }));

  const chartHeight = Math.max(ivaData.length * 38 + 40, 200);

  return (
    <div className="space-y-5">
      {/* 2 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Imponibile Totale */}
        <div className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: COLORS.accentAmber }}
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4" style={{ color: COLORS.accentAmber }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                Imponibile Totale
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-text-primary">
              {formatCurrency(totalImponibile)}
            </p>
            <p className="mt-1 text-[11px] text-text-dim">
              Base imponibile netta (senza IVA)
            </p>
          </div>
        </div>

        {/* IVA Totale */}
        <div className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: COLORS.accentRed }}
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4" style={{ color: COLORS.accentRed }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                IVA Totale
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-text-primary">
              {formatCurrency(totalIva)}
            </p>
            <p className="mt-1 text-[11px] text-text-dim">
              Aliquota media effettiva: {formatPercent(effectiveVatRate)}
            </p>
          </div>
        </div>
      </div>

      {/* IVA per sector bar chart */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-muted">
          IVA per Settore (Top 8)
        </p>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={ivaData}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) =>
                v >= 1000 ? `\u20AC${(v / 1000).toFixed(0)}k` : `\u20AC${v}`
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
            <Tooltip content={<IvaTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="iva" radius={[0, 4, 4, 0]} barSize={18}>
              {ivaData.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS.accentRed}
                  opacity={1 - i * 0.08}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
