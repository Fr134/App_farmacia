import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent, formatInteger } from "@/lib/formatters";
import type { SectorData } from "@/types";

interface Props {
  sectors: SectorData[];
}

type SortKey =
  | "tipologia"
  | "valore"
  | "valorePct"
  | "costoVenduto"
  | "margine"
  | "marginePct"
  | "ricaricoPct"
  | "pezzi"
  | "nVendite"
  | "pezziRicetta"
  | "pezziLibera"
  | "pezziFidelity";

type SortDir = "asc" | "desc";

interface Column {
  key: SortKey;
  label: string;
  format: (s: SectorData) => string;
  align: "left" | "right";
  colorFn?: (s: SectorData) => string | undefined;
}

const COLUMNS: Column[] = [
  {
    key: "tipologia",
    label: "Tipologia",
    format: (s) => s.tipologia,
    align: "left",
  },
  {
    key: "valore",
    label: "Valore",
    format: (s) => formatCurrency(s.valore),
    align: "right",
  },
  {
    key: "valorePct",
    label: "%",
    format: (s) => (s.valorePct != null ? formatPercent(s.valorePct) : "–"),
    align: "right",
  },
  {
    key: "costoVenduto",
    label: "Costo",
    format: (s) =>
      s.costoVenduto != null ? formatCurrency(s.costoVenduto) : "–",
    align: "right",
  },
  {
    key: "margine",
    label: "Margine",
    format: (s) => (s.margine != null ? formatCurrency(s.margine) : "–"),
    align: "right",
    colorFn: (s) =>
      s.margine != null && s.margine < 0 ? COLORS.accentRed : undefined,
  },
  {
    key: "marginePct",
    label: "Marg. %",
    format: (s) => (s.marginePct != null ? formatPercent(s.marginePct) : "–"),
    align: "right",
    colorFn: (s) =>
      s.marginePct != null && s.marginePct < 0 ? COLORS.accentRed : undefined,
  },
  {
    key: "ricaricoPct",
    label: "Ricar. %",
    format: (s) => (s.ricaricoPct != null ? formatPercent(s.ricaricoPct) : "–"),
    align: "right",
  },
  {
    key: "pezzi",
    label: "Pezzi",
    format: (s) => formatInteger(s.pezzi),
    align: "right",
  },
  {
    key: "nVendite",
    label: "Vendite",
    format: (s) => formatInteger(s.nVendite),
    align: "right",
  },
  {
    key: "pezziRicetta",
    label: "Ricetta",
    format: (s) =>
      s.pezziRicetta != null ? formatInteger(s.pezziRicetta) : "–",
    align: "right",
  },
  {
    key: "pezziLibera",
    label: "Libera",
    format: (s) =>
      s.pezziLibera != null ? formatInteger(s.pezziLibera) : "–",
    align: "right",
  },
  {
    key: "pezziFidelity",
    label: "Fidelity",
    format: (s) =>
      s.pezziFidelity != null ? formatInteger(s.pezziFidelity) : "–",
    align: "right",
  },
];

function getSortValue(s: SectorData, key: SortKey): number | string {
  if (key === "tipologia") return s.tipologia.toLowerCase();
  const v = s[key];
  return v ?? -Infinity;
}

export default function DetailTable({ sectors }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("valore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "tipologia" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    return [...sectors].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);

      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }

      const na = va as number;
      const nb = vb as number;
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [sectors, sortKey, sortDir]);

  if (sectors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-dim">
        Nessun dato disponibile
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-btn">
      <table className="w-full min-w-[900px] border-collapse text-xs">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`sticky top-0 z-10 cursor-pointer select-none border-b border-border-card bg-bg-card px-3 py-2.5 font-medium transition-colors hover:text-accent-blue ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${isActive ? "text-accent-blue" : "text-text-muted"}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {isActive &&
                      (sortDir === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((sector) => {
            const hasNegMargin =
              sector.margine != null && sector.margine < 0;

            return (
              <tr
                key={sector.id}
                className={`border-b border-border-card/50 transition-colors hover:bg-white/[0.03] ${
                  hasNegMargin ? "bg-accent-red/[0.04]" : ""
                }`}
              >
                {COLUMNS.map((col) => {
                  const color = col.colorFn?.(sector);
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${
                        col.key === "tipologia"
                          ? "font-medium text-text-primary"
                          : "font-mono text-text-muted"
                      }`}
                      style={color ? { color } : undefined}
                    >
                      {col.format(sector)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
