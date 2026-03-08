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
  aggregatedPeriods?: number;
};

// Client-side aliases
export type Report = SerializedReport;
export type SectorData = SerializedSectorData;

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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

// ─── Expense Module Types ─────────────────────────────

export type RecurrenceType = "NONE" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type ExpenseSource = "MANUAL" | "INVOICE" | "IMPORT";
export type InstanceStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type InvoiceStatus = "IMPORTED" | "MATCHED" | "RECONCILED" | "REJECTED";

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isSystem: boolean;
}

export interface Supplier {
  id: string;
  pharmacyId: string;
  ragioneSociale: string;
  piva?: string;
  codiceFiscale?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  pharmacyId: string;
  name: string;
  description?: string;
  category: ExpenseCategory;
  categoryId: string;
  supplier?: Supplier;
  supplierId?: string;
  amountNet: number;
  vatRate: number;
  amountGross: number;
  isVatDeductible: boolean;
  recurrenceType: RecurrenceType;
  isFixedCost: boolean;
  validFrom: string;
  validTo?: string;
  source: ExpenseSource;
  passiveInvoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ExpenseFormData {
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  amountNet: number;
  vatRate: number;
  isVatDeductible: boolean;
  recurrenceType: RecurrenceType;
  isFixedCost: boolean;
  validFrom: string;
  validTo?: string;
  notes?: string;
}

export interface ExpenseSummary {
  totalMonthlyNet: number;
  totalMonthlyGross: number;
  fixedCostsMonthly: number;
  variableCostsMonthly: number;
  deductibleVatMonthly: number;
  byCategory: {
    categoryName: string;
    color: string;
    icon: string;
    total: number;
  }[];
}

export interface QuarterlyVatData {
  ivaDebito: number;
  monthsInQuarter: number;
  quarterStart: number;
  quarterEnd: number;
}

// ─── Budget Module Types ─────────────────────────────

export type BudgetStatus = "DRAFT" | "CONFIRMED" | "ARCHIVED";
export type BaselineSource = "HISTORICAL" | "MANUAL";
export type AdjustmentMode = "PCT_CHANGE" | "ABSOLUTE" | "NO_CHANGE";

export interface BudgetRevenueLine {
  id: string;
  budgetId: string;
  categoryLabel: string;
  baselineRevenue: number;
  baselineMarginPct: number;
  baselinePieces?: number;
  adjustmentMode: AdjustmentMode;
  adjustmentPct?: number;
  adjustmentAbsolute?: number;
  forecastRevenue: number;
  forecastCOGS: number;
  forecastMargin: number;
  sortOrder: number;
}

export interface BudgetExpenseLine {
  id: string;
  budgetId: string;
  expenseId?: string;
  name: string;
  categoryLabel: string;
  amountNet: number;
  vatRate: number;
  amountGross: number;
  recurrenceType: RecurrenceType;
  annualAmountNet: number;
  isStructural: boolean;
  notes?: string;
  sortOrder: number;
}

export interface Budget {
  id: string;
  pharmacyId: string;
  name: string;
  year: number;
  status: BudgetStatus;
  baselineSource: BaselineSource;
  baselineYear?: number;
  globalAdjustmentPct?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  revenueLines: BudgetRevenueLine[];
  expenseLines: BudgetExpenseLine[];
}

export interface BudgetSummary {
  totalForecastRevenue: number;
  totalForecastCOGS: number;
  totalForecastMargin: number;
  forecastMarginPct: number;
  totalAnnualExpenses: number;
  totalAnnualExpensesGross: number;
  estimatedEBITDA: number;
  ebitdaMarginPct: number;
}

export interface BudgetWithSummary extends Budget {
  summary: BudgetSummary;
}
