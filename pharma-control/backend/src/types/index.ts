export interface ParsedSector {
  tipologia: string;
  valore: number;
  valorePct: number | null;
  mediaPezzi: number | null;
  pezzi: number;
  pezziPct: number | null;
  nVendite: number;
  venditePct: number | null;
  costoVenduto: number | null;
  margine: number | null;
  margineTotPct: number | null;
  marginePct: number | null;
  ricaricoPct: number | null;
  pezziRicetta: number | null;
  pezziRicettaPct: number | null;
  pezziLibera: number | null;
  pezziLiberaPct: number | null;
  pezziFidelity: number | null;
  pezziFidelityPct: number | null;
  valoreRicetta: number | null;
  valoreRicettaPct: number | null;
  valoreLibera: number | null;
  valoreLiberaPct: number | null;
  valoreFidelity: number | null;
  valoreFidelityPct: number | null;
  imponibile: number | null;
  imponibilePct: number | null;
  iva: number | null;
  ivaPct: number | null;
}

export interface ParsedTotals {
  totalRevenueGross: number;
  totalRevenueNet: number;
  totalIva: number;
  totalCost: number;
  totalMargin: number;
  totalMarginPct: number;
  totalMarkupPct: number;
  totalPieces: number;
  totalSales: number;
}

export interface ParsedPeriod {
  month: number;
  year: number;
}

export interface ParsedReport {
  sectors: ParsedSector[];
  totals: ParsedTotals;
  period: ParsedPeriod;
  filename: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SerializedReport {
  id: string;
  filename: string;
  fileHash: string;
  periodMonth: number;
  periodYear: number;
  uploadedAt: string;
  totalRevenueGross: number;
  totalRevenueNet: number;
  totalIva: number;
  totalCost: number;
  totalMargin: number;
  totalMarginPct: number;
  totalMarkupPct: number;
  totalPieces: number;
  totalSales: number;
}

export interface SerializedSectorData {
  id: string;
  reportId: string;
  tipologia: string;
  valore: number;
  valorePct: number | null;
  mediaPezzi: number | null;
  pezzi: number;
  pezziPct: number | null;
  nVendite: number;
  venditePct: number | null;
  costoVenduto: number | null;
  margine: number | null;
  margineTotPct: number | null;
  marginePct: number | null;
  ricaricoPct: number | null;
  pezziRicetta: number | null;
  pezziRicettaPct: number | null;
  pezziLibera: number | null;
  pezziLiberaPct: number | null;
  pezziFidelity: number | null;
  pezziFidelityPct: number | null;
  valoreRicetta: number | null;
  valoreRicettaPct: number | null;
  valoreLibera: number | null;
  valoreLiberaPct: number | null;
  valoreFidelity: number | null;
  valoreFidelityPct: number | null;
  imponibile: number | null;
  imponibilePct: number | null;
  iva: number | null;
  ivaPct: number | null;
}

export type ReportWithSectors = SerializedReport & {
  sectors: SerializedSectorData[];
};

export interface ReportSummary {
  id: string;
  filename: string;
  periodMonth: number;
  periodYear: number;
  uploadedAt: string;
  totalRevenueGross: number;
}

export interface UploadResult {
  reportId: string;
  period: { month: number; year: number };
  warnings: string[];
}
