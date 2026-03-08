import type {
  BudgetRevenueLine,
  BudgetExpenseLine,
  BudgetSummary,
  AdjustmentMode
} from '../types/budget';
import type { RecurrenceType } from '../types/index';

/**
 * Calculate forecast values for a single revenue line.
 * baselineMarginPct is LOCKED — never changes regardless of adjustment.
 */
export function computeRevenueLine(
  baselineRevenue: number,
  baselineMarginPct: number,   // e.g. 27.69
  adjustmentMode: AdjustmentMode,
  adjustmentPct?: number,
  adjustmentAbsolute?: number
): { forecastRevenue: number; forecastCOGS: number; forecastMargin: number } {
  let forecastRevenue: number;

  switch (adjustmentMode) {
    case 'PCT_CHANGE':
      forecastRevenue = baselineRevenue * (1 + (adjustmentPct ?? 0) / 100);
      break;
    case 'ABSOLUTE':
      forecastRevenue = adjustmentAbsolute ?? baselineRevenue;
      break;
    case 'NO_CHANGE':
    default:
      forecastRevenue = baselineRevenue;
  }

  const marginRate = baselineMarginPct / 100;
  const forecastMargin = forecastRevenue * marginRate;
  const forecastCOGS = forecastRevenue - forecastMargin;

  return {
    forecastRevenue: round2(forecastRevenue),
    forecastCOGS: round2(forecastCOGS),
    forecastMargin: round2(forecastMargin),
  };
}

/**
 * Normalize any expense to its annual net amount.
 */
export function annualizeExpense(
  amountNet: number,
  recurrenceType: RecurrenceType
): number {
  switch (recurrenceType) {
    case 'MONTHLY':   return round2(amountNet * 12);
    case 'QUARTERLY': return round2(amountNet * 4);
    case 'ANNUAL':    return round2(amountNet);
    case 'NONE':      return round2(amountNet); // one-time = counted once
    default:          return 0;
  }
}

/**
 * Build the full BudgetSummary from revenue and expense lines.
 */
export function computeBudgetSummary(
  revenueLines: BudgetRevenueLine[],
  expenseLines: BudgetExpenseLine[]
): BudgetSummary {
  const totalForecastRevenue = sum(revenueLines.map(l => l.forecastRevenue));
  const totalForecastCOGS    = sum(revenueLines.map(l => l.forecastCOGS));
  const totalForecastMargin  = sum(revenueLines.map(l => l.forecastMargin));
  const totalAnnualExpenses  = sum(expenseLines.map(l => l.annualAmountNet));
  const totalAnnualExpensesGross = sum(expenseLines.map(l =>
    l.amountGross * annualizeExpense(1, l.recurrenceType)
  ));

  const estimatedEBITDA = totalForecastMargin - totalAnnualExpenses;

  return {
    totalForecastRevenue:     round2(totalForecastRevenue),
    totalForecastCOGS:        round2(totalForecastCOGS),
    totalForecastMargin:      round2(totalForecastMargin),
    forecastMarginPct:        totalForecastRevenue > 0
                                ? round2(totalForecastMargin / totalForecastRevenue * 100)
                                : 0,
    totalAnnualExpenses:      round2(totalAnnualExpenses),
    totalAnnualExpensesGross: round2(totalAnnualExpensesGross),
    estimatedEBITDA:          round2(estimatedEBITDA),
    ebitdaMarginPct:          totalForecastRevenue > 0
                                ? round2(estimatedEBITDA / totalForecastRevenue * 100)
                                : 0,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
