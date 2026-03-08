import type { RecurrenceType } from './index';

export type BudgetStatus = 'DRAFT' | 'CONFIRMED' | 'ARCHIVED';
export type BaselineSource = 'HISTORICAL' | 'MANUAL';
export type AdjustmentMode = 'PCT_CHANGE' | 'ABSOLUTE' | 'NO_CHANGE';

export interface BudgetRevenueLine {
  id: string;
  budgetId: string;
  categoryLabel: string;

  // Baseline (locked)
  baselineRevenue: number;
  baselineMarginPct: number;    // e.g. 27.69
  baselinePieces?: number;

  // User input
  adjustmentMode: AdjustmentMode;
  adjustmentPct?: number;       // e.g. 10 = +10%
  adjustmentAbsolute?: number;

  // Computed forecast (server-side)
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

// Derived summary — computed client or server side
export interface BudgetSummary {
  totalForecastRevenue: number;
  totalForecastCOGS: number;
  totalForecastMargin: number;
  forecastMarginPct: number;        // totalForecastMargin / totalForecastRevenue * 100
  totalAnnualExpenses: number;
  totalAnnualExpensesGross: number;
  estimatedEBITDA: number;          // totalForecastMargin - totalAnnualExpenses
  ebitdaMarginPct: number;          // estimatedEBITDA / totalForecastRevenue * 100
}

// Input for creating/updating a budget
export interface BudgetFormData {
  name: string;
  year: number;
  baselineSource: BaselineSource;
  baselineYear?: number;
  globalAdjustmentPct?: number;
  notes?: string;
}

// Input when user sets adjustment for a revenue line
export interface RevenueLineAdjustment {
  lineId: string;
  adjustmentMode: AdjustmentMode;
  adjustmentPct?: number;
  adjustmentAbsolute?: number;
}

// Payload for importing expenses into budget
export interface ImportExpensesPayload {
  budgetId: string;
  expenseIds: string[];   // IDs of Expense records to import as structural lines
}
