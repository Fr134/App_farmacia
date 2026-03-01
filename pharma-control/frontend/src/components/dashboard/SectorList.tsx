import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CHART_COLORS, COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatPercent,
  formatInteger,
} from "@/lib/formatters";
import StatMini from "@/components/ui/StatMini";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
  highlightedSector?: string | null;
}

const CODICE_AGGANCIO = "Codice di aggancio";

export default function SectorList({ sectors, highlightedSector }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-expand highlighted sector
  useEffect(() => {
    if (highlightedSector) {
      const match = sectors.find((s) => s.tipologia === highlightedSector);
      if (match) {
        setExpandedId(match.id);
      }
    }
  }, [highlightedSector, sectors]);

  const mainSectors = sectors
    .filter((s) => s.tipologia !== CODICE_AGGANCIO)
    .sort((a, b) => b.valore - a.valore);
  const aggancioSectors = sectors.filter(
    (s) => s.tipologia === CODICE_AGGANCIO
  );
  const sorted = [...mainSectors, ...aggancioSectors];

  const maxValore = Math.max(...mainSectors.map((s) => s.valore), 1);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((sector, index) => {
        const isAggancio = sector.tipologia === CODICE_AGGANCIO;
        const isExpanded = expandedId === sector.id;
        const isHighlighted = highlightedSector === sector.tipologia;
        const barWidth = isAggancio
          ? 0
          : Math.max((sector.valore / maxValore) * 100, 1);
        const rank = isAggancio ? null : index + 1;
        const badgeColor = isAggancio
          ? COLORS.accentRed
          : CHART_COLORS[index % CHART_COLORS.length];
        const avgValue =
          sector.nVendite > 0 ? sector.valore / sector.nVendite : null;

        return (
          <div
            key={sector.id}
            className={`rounded-btn border transition-all duration-500 ${
              isHighlighted
                ? "border-accent-blue ring-1 ring-accent-blue/30 bg-accent-blue/[0.05]"
                : isAggancio
                  ? "border-accent-red/20 bg-accent-red/[0.03]"
                  : "border-border-card bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            {/* Row */}
            <button
              onClick={() => toggleExpand(sector.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              {/* Rank badge */}
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {rank ?? "\u2013"}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm font-medium ${
                      isAggancio ? "text-accent-red" : "text-text-primary"
                    }`}
                  >
                    {sector.tipologia}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-xs text-text-muted">
                      {formatPercent(sector.valorePct ?? 0)}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        isAggancio ? "text-accent-red" : "text-text-primary"
                      }`}
                    >
                      {formatCurrency(sector.valore)}
                    </span>
                  </div>
                </div>

                {/* Proportional bar */}
                {!isAggancio && (
                  <div className="mt-1.5 h-1 w-full rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: badgeColor,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Chevron */}
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-text-dim transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="space-y-2 px-4 pb-4">
                {/* Row 1: Core stats */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatMini
                    label="Costo Venduto"
                    value={
                      sector.costoVenduto !== null
                        ? formatCurrency(sector.costoVenduto)
                        : "N/A"
                    }
                    color={COLORS.accentAmber}
                  />
                  <StatMini
                    label="Margine"
                    value={
                      sector.margine !== null
                        ? formatCurrency(sector.margine)
                        : "N/A"
                    }
                    color={COLORS.accentGreen}
                  />
                  <StatMini
                    label="Margine %"
                    value={
                      sector.marginePct !== null
                        ? formatPercent(sector.marginePct)
                        : "N/A"
                    }
                    color={COLORS.accentGreen}
                  />
                  <StatMini
                    label="Ricarico %"
                    value={
                      sector.ricaricoPct !== null
                        ? formatPercent(sector.ricaricoPct)
                        : "N/A"
                    }
                    color={COLORS.accentPurple}
                  />
                  <StatMini
                    label="Pezzi"
                    value={formatInteger(sector.pezzi)}
                  />
                  <StatMini
                    label="N. Vendite"
                    value={formatInteger(sector.nVendite)}
                  />
                  <StatMini
                    label="% Margine Tot"
                    value={
                      sector.margineTotPct !== null
                        ? formatPercent(sector.margineTotPct)
                        : "N/A"
                    }
                    color={COLORS.accentCyan}
                  />
                  <StatMini
                    label="Valore Medio"
                    value={avgValue !== null ? formatCurrency(avgValue) : "N/A"}
                  />
                </div>

                {/* Row 2: Channel breakdown + fiscal stats */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatMini
                    label="Pezzi Ricetta"
                    value={
                      sector.pezziRicetta !== null
                        ? formatInteger(sector.pezziRicetta)
                        : "N/A"
                    }
                    color={COLORS.accentBlue}
                  />
                  <StatMini
                    label="Pezzi Libera"
                    value={
                      sector.pezziLibera !== null
                        ? formatInteger(sector.pezziLibera)
                        : "N/A"
                    }
                    color={COLORS.accentPurple}
                  />
                  <StatMini
                    label="Pezzi Fidelity"
                    value={
                      sector.pezziFidelity !== null
                        ? formatInteger(sector.pezziFidelity)
                        : "N/A"
                    }
                    color={COLORS.accentCyan}
                  />
                  <StatMini
                    label="Valore Ricetta"
                    value={
                      sector.valoreRicetta !== null
                        ? formatCurrency(sector.valoreRicetta)
                        : "N/A"
                    }
                    color={COLORS.accentBlue}
                  />
                  <StatMini
                    label="Valore Libera"
                    value={
                      sector.valoreLibera !== null
                        ? formatCurrency(sector.valoreLibera)
                        : "N/A"
                    }
                    color={COLORS.accentPurple}
                  />
                  <StatMini
                    label="Valore Fidelity"
                    value={
                      sector.valoreFidelity !== null
                        ? formatCurrency(sector.valoreFidelity)
                        : "N/A"
                    }
                    color={COLORS.accentCyan}
                  />
                  <StatMini
                    label="Imponibile"
                    value={
                      sector.imponibile !== null
                        ? formatCurrency(sector.imponibile)
                        : "N/A"
                    }
                    color={COLORS.accentAmber}
                  />
                  <StatMini
                    label="IVA"
                    value={
                      sector.iva !== null
                        ? formatCurrency(sector.iva)
                        : "N/A"
                    }
                    color={COLORS.accentRed}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
