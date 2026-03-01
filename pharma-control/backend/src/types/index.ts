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

export type AlertSeverity = "critical" | "warning" | "info" | "positive";
export type AlertCategory = "margin" | "revenue" | "cost" | "volume" | "channel" | "concentration" | "anomaly";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  sector?: string;
  metric: string;
  currentValue: number;
  previousValue?: number;
  delta?: number;
  threshold?: number;
}

export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  positive: number;
}

export interface AlertResponse {
  alerts: Alert[];
  summary: AlertSummary;
}
