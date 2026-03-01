import { VALID_TIPOLOGIE } from "./constants";
import type { ParsedReport, ValidationResult } from "@/types";

const CODICE_AGGANCIO = "Codice di aggancio";

export function validateCsvData(parsed: ParsedReport): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Minimum sectors
  if (parsed.sectors.length < 3) {
    errors.push(
      `Trovati solo ${parsed.sectors.length} settori, minimo atteso: 3`
    );
  }

  // 2. Revenue consistency: sum of sector valore ≈ total (±1%)
  const sectorValoreSum = parsed.sectors.reduce(
    (sum, s) => sum + s.valore,
    0
  );
  const totalGross = parsed.totals.totalRevenueGross;

  if (totalGross > 0) {
    const diff = Math.abs(sectorValoreSum - totalGross);
    const tolerance = totalGross * 0.01;
    if (diff > tolerance) {
      errors.push(
        `Somma valori settori (${sectorValoreSum.toFixed(2)}) non corrisponde al totale ` +
          `(${totalGross.toFixed(2)}). Differenza: ${diff.toFixed(2)}, tolleranza: ±1%`
      );
    }
  }

  // 3-4. Per-sector validation
  for (const sector of parsed.sectors) {
    const name = sector.tipologia;
    const isCodiceAggancio = name === CODICE_AGGANCIO;

    // Validate tipologia
    if (
      !VALID_TIPOLOGIE.includes(name as (typeof VALID_TIPOLOGIE)[number]) &&
      !name.startsWith("TOTALE")
    ) {
      warnings.push(`Tipologia non riconosciuta: "${name}"`);
    }

    // Margin % range check (skip null)
    if (sector.marginePct !== null) {
      if (sector.marginePct < -200 || sector.marginePct > 300) {
        if (!isCodiceAggancio) {
          errors.push(
            `Margine % fuori range per "${name}": ${sector.marginePct}% (atteso: -200% / +300%)`
          );
        } else {
          warnings.push(
            `Margine % anomalo per "${name}": ${sector.marginePct}%`
          );
        }
      }
    }

    // Pezzi and N. Vendite must be non-negative (except Codice di aggancio)
    if (!isCodiceAggancio) {
      if (sector.pezzi < 0) {
        errors.push(
          `Pezzi negativi per "${name}": ${sector.pezzi}`
        );
      }
      if (sector.nVendite < 0) {
        errors.push(
          `N. Vendite negative per "${name}": ${sector.nVendite}`
        );
      }
    }

    // Sector valore > total (except Codice di aggancio)
    if (!isCodiceAggancio && totalGross > 0 && sector.valore > totalGross) {
      errors.push(
        `Valore settore "${name}" (${sector.valore.toFixed(2)}) supera il totale (${totalGross.toFixed(2)})`
      );
    }
  }

  // 5. Period validation
  const { month, year } = parsed.period;
  if (month < 1 || month > 12) {
    errors.push(`Mese non valido: ${month} (atteso: 1-12)`);
  }
  if (year < 2020) {
    errors.push(`Anno non valido: ${year} (atteso: >= 2020)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
