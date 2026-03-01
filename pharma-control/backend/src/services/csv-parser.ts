import * as iconv from "iconv-lite";
import { MESI_ITALIANI } from "../constants";
import { parseItalianNumber, parseItalianInteger } from "../lib/formatters";
import type { ParsedSector, ParsedTotals, ParsedPeriod, ParsedReport } from "../types";

const EXPECTED_COLUMNS = 29;
const TOTALE_PREFIX = "TOTALE VENDITE DEL PERIODO";

function decodeBuffer(buffer: Buffer): string {
  const utf8 = buffer.toString("utf-8");
  if (utf8.includes("\ufffd") || /\u00c3[\x80-\xBF]/.test(utf8)) {
    return iconv.decode(buffer, "latin1");
  }
  return utf8;
}

function parseSectorRow(columns: string[]): ParsedSector {
  return {
    tipologia: columns[0].trim(),
    valore: parseItalianNumber(columns[1]) ?? 0,
    valorePct: parseItalianNumber(columns[2]),
    mediaPezzi: parseItalianNumber(columns[3]),
    pezzi: parseItalianInteger(columns[4]) ?? 0,
    pezziPct: parseItalianNumber(columns[5]),
    nVendite: parseItalianInteger(columns[6]) ?? 0,
    venditePct: parseItalianNumber(columns[7]),
    costoVenduto: parseItalianNumber(columns[8]),
    margine: parseItalianNumber(columns[9]),
    margineTotPct: parseItalianNumber(columns[10]),
    marginePct: parseItalianNumber(columns[11]),
    ricaricoPct: parseItalianNumber(columns[12]),
    pezziRicetta: parseItalianInteger(columns[13]),
    pezziRicettaPct: parseItalianNumber(columns[14]),
    pezziLibera: parseItalianInteger(columns[15]),
    pezziLiberaPct: parseItalianNumber(columns[16]),
    pezziFidelity: parseItalianInteger(columns[17]),
    pezziFidelityPct: parseItalianNumber(columns[18]),
    valoreRicetta: parseItalianNumber(columns[19]),
    valoreRicettaPct: parseItalianNumber(columns[20]),
    valoreLibera: parseItalianNumber(columns[21]),
    valoreLiberaPct: parseItalianNumber(columns[22]),
    valoreFidelity: parseItalianNumber(columns[23]),
    valoreFidelityPct: parseItalianNumber(columns[24]),
    imponibile: parseItalianNumber(columns[25]),
    imponibilePct: parseItalianNumber(columns[26]),
    iva: parseItalianNumber(columns[27]),
    ivaPct: parseItalianNumber(columns[28]),
  };
}

function parseTotalsRow(columns: string[]): ParsedTotals {
  const totalRevenueGross = parseItalianNumber(columns[1]) ?? 0;
  const totalCost = parseItalianNumber(columns[8]) ?? 0;
  const totalMargin = parseItalianNumber(columns[9]) ?? 0;
  const totalMarginPct = parseItalianNumber(columns[11]) ?? 0;
  const totalMarkupPct = parseItalianNumber(columns[12]) ?? 0;
  const totalPieces = parseItalianInteger(columns[4]) ?? 0;
  const totalSales = parseItalianInteger(columns[6]) ?? 0;
  const totalRevenueNet = parseItalianNumber(columns[25]) ?? 0;
  const totalIva = parseItalianNumber(columns[27]) ?? 0;

  return {
    totalRevenueGross,
    totalRevenueNet,
    totalIva,
    totalCost,
    totalMargin,
    totalMarginPct,
    totalMarkupPct,
    totalPieces,
    totalSales,
  };
}

function extractPeriod(filename: string): ParsedPeriod {
  const lower = filename.toLowerCase();

  for (const [mese, monthNum] of Object.entries(MESI_ITALIANI)) {
    const regex = new RegExp(`_${mese}_(\\d{2})(?:\\.csv)?$`);
    const match = lower.match(regex);
    if (match) {
      const shortYear = parseInt(match[1], 10);
      const year = shortYear < 100 ? 2000 + shortYear : shortYear;
      return { month: monthNum, year };
    }
  }

  throw new Error(
    `Impossibile estrarre il periodo dal nome file "${filename}". ` +
      "Formato atteso: *_mese_AA.csv (es: vendite_gennaio_26.csv)"
  );
}

export function parseCsvFile(buffer: Buffer, filename: string): ParsedReport {
  const content = decodeBuffer(buffer);
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("Il file CSV è vuoto o contiene solo l'header");
  }

  const header = lines[0].split(";");
  if (header.length !== EXPECTED_COLUMNS) {
    throw new Error(
      `Il file deve avere ${EXPECTED_COLUMNS} colonne, trovate ${header.length}`
    );
  }
  if (header[0].trim() !== "Tipologia") {
    throw new Error(
      `La prima colonna dell'header deve essere "Tipologia", trovato "${header[0].trim()}"`
    );
  }

  const sectors: ParsedSector[] = [];
  let totals: ParsedTotals | null = null;
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(";");

    if (columns.length !== EXPECTED_COLUMNS) {
      skippedRows++;
      continue;
    }

    const firstCol = columns[0].trim();

    if (firstCol.startsWith(TOTALE_PREFIX)) {
      totals = parseTotalsRow(columns);
      break;
    }

    if (firstCol === "") {
      continue;
    }

    sectors.push(parseSectorRow(columns));
  }

  if (!totals) {
    throw new Error(
      `Riga "${TOTALE_PREFIX}" non trovata nel file. Il file potrebbe essere incompleto.`
    );
  }

  if (skippedRows > 0) {
    console.warn(
      `CSV parser: ${skippedRows} righe ignorate (numero colonne errato)`
    );
  }

  const period = extractPeriod(filename);

  return { sectors, totals, period, filename };
}
