import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  computeRevenueLine,
  computeBudgetSummary,
  annualizeExpense,
} from "../lib/budgetCalculations";
import type {
  Budget,
  BudgetRevenueLine,
  BudgetExpenseLine,
  BudgetSummary,
  AdjustmentMode,
  BudgetStatus,
  BaselineSource,
} from "../types/budget";
import type { RecurrenceType } from "../types";

// ─── Prisma type helpers ──────────────────────────────

type PrismaBudget = Prisma.BudgetGetPayload<{
  include: { revenueLines: true; expenseLines: true };
}>;

type PrismaRevenueLine = Prisma.BudgetRevenueLineGetPayload<object>;
type PrismaExpenseLine = Prisma.BudgetExpenseLineGetPayload<object>;

// ─── Serializers (Decimal → number, camelCase) ────────

function serializeRevenueLine(l: PrismaRevenueLine): BudgetRevenueLine {
  return {
    id: l.id,
    budgetId: l.budgetId,
    categoryLabel: l.categoryLabel,
    baselineRevenue: l.baselineRevenue.toNumber(),
    baselineMarginPct: l.baselineMarginPct.toNumber(),
    baselinePieces: l.baselinePieces ?? undefined,
    adjustmentMode: l.adjustmentMode as AdjustmentMode,
    adjustmentPct: l.adjustmentPct?.toNumber() ?? undefined,
    adjustmentAbsolute: l.adjustmentAbsolute?.toNumber() ?? undefined,
    forecastRevenue: l.forecastRevenue.toNumber(),
    forecastCOGS: l.forecastCOGS.toNumber(),
    forecastMargin: l.forecastMargin.toNumber(),
    sortOrder: l.sortOrder,
  };
}

function serializeExpenseLine(l: PrismaExpenseLine): BudgetExpenseLine {
  return {
    id: l.id,
    budgetId: l.budgetId,
    expenseId: l.expenseId ?? undefined,
    name: l.name,
    categoryLabel: l.categoryLabel,
    amountNet: l.amountNet.toNumber(),
    vatRate: l.vatRate.toNumber(),
    amountGross: l.amountGross.toNumber(),
    recurrenceType: l.recurrenceType as RecurrenceType,
    annualAmountNet: l.annualAmountNet.toNumber(),
    isStructural: l.isStructural,
    notes: l.notes ?? undefined,
    sortOrder: l.sortOrder,
  };
}

function serializeBudget(b: PrismaBudget): Budget {
  return {
    id: b.id,
    pharmacyId: b.pharmacyId,
    name: b.name,
    year: b.year,
    status: b.status as BudgetStatus,
    baselineSource: b.baselineSource as BaselineSource,
    baselineYear: b.baselineYear ?? undefined,
    globalAdjustmentPct: b.globalAdjustmentPct?.toNumber() ?? undefined,
    notes: b.notes ?? undefined,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    revenueLines: b.revenueLines.map(serializeRevenueLine),
    expenseLines: b.expenseLines.map(serializeExpenseLine),
  };
}

function buildSummary(budget: Budget): BudgetSummary {
  return computeBudgetSummary(budget.revenueLines, budget.expenseLines);
}

// ─── Queries ──────────────────────────────────────────

export async function getBudgets(
  pharmacyId: string
): Promise<Array<Budget & { summary: BudgetSummary }>> {
  const rows = await prisma.budget.findMany({
    where: { pharmacyId },
    include: { revenueLines: true, expenseLines: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => {
    const budget = serializeBudget(row);
    return { ...budget, summary: buildSummary(budget) };
  });
}

export async function getBudgetById(
  id: string
): Promise<{ budget: Budget; summary: BudgetSummary } | null> {
  const row = await prisma.budget.findUnique({
    where: { id },
    include: {
      revenueLines: { orderBy: { sortOrder: "asc" } },
      expenseLines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) return null;

  const budget = serializeBudget(row);
  return { budget, summary: buildSummary(budget) };
}

export async function getBudgetSummaryById(
  id: string
): Promise<BudgetSummary | null> {
  const result = await getBudgetById(id);
  if (!result) return null;
  return result.summary;
}

// ─── Create ───────────────────────────────────────────

export interface CreateBudgetInput {
  pharmacyId: string;
  name: string;
  year: number;
  baselineSource: BaselineSource;
  baselineYear?: number;
  globalAdjustmentPct?: number;
  notes?: string;
}

export async function createBudget(
  input: CreateBudgetInput
): Promise<{ budget: Budget; summary: BudgetSummary }> {
  // If HISTORICAL, fetch sector data from reports for the baseline year
  let revenueLineData: Prisma.BudgetRevenueLineCreateManyBudgetInput[] = [];

  if (input.baselineSource === "HISTORICAL") {
    if (!input.baselineYear) {
      throw new ValidationError(
        "L'anno di riferimento è obbligatorio per la modalità storica."
      );
    }

    // Get all reports for the baseline year
    const reports = await prisma.report.findMany({
      where: { period_year: input.baselineYear },
      include: { sectors: true },
    });

    if (reports.length === 0) {
      throw new ValidationError(
        `Nessun dato di vendita trovato per l'anno ${input.baselineYear}. Carica un report prima o usa la modalità manuale.`
      );
    }

    // Aggregate sector data across all months of the year
    const categoryMap = new Map<
      string,
      { totalRevenue: number; totalMargin: number; totalPieces: number }
    >();

    for (const report of reports) {
      for (const sector of report.sectors) {
        const existing = categoryMap.get(sector.tipologia);
        const valore = sector.valore.toNumber();
        const margine = sector.margine?.toNumber() ?? 0;
        const pezzi = sector.pezzi;

        if (existing) {
          existing.totalRevenue += valore;
          existing.totalMargin += margine;
          existing.totalPieces += pezzi;
        } else {
          categoryMap.set(sector.tipologia, {
            totalRevenue: valore,
            totalMargin: margine,
            totalPieces: pezzi,
          });
        }
      }
    }

    let sortIndex = 0;
    for (const [categoryLabel, data] of categoryMap) {
      const baselineRevenue = Math.round(data.totalRevenue * 100) / 100;
      // Compute margin % from actual revenue and margin
      const baselineMarginPct =
        data.totalRevenue > 0
          ? Math.round((data.totalMargin / data.totalRevenue) * 10000) / 100
          : 0;

      const forecast = computeRevenueLine(
        baselineRevenue,
        baselineMarginPct,
        "NO_CHANGE"
      );

      revenueLineData.push({
        categoryLabel,
        baselineRevenue,
        baselineMarginPct,
        baselinePieces: data.totalPieces,
        adjustmentMode: "NO_CHANGE",
        adjustmentPct: 0,
        forecastRevenue: forecast.forecastRevenue,
        forecastCOGS: forecast.forecastCOGS,
        forecastMargin: forecast.forecastMargin,
        sortOrder: sortIndex++,
      });
    }
  }

  // Auto-import structural expense lines from the Expenses module
  const expenses = await prisma.expense.findMany({
    where: { pharmacy_id: input.pharmacyId, deleted_at: null },
    include: { category: true },
  });

  const expenseLineData: Prisma.BudgetExpenseLineCreateManyBudgetInput[] =
    expenses.map((e, i) => {
      const amountNet = e.amount_net.toNumber();
      const vatRate = e.vat_rate.toNumber();
      const amountGross = e.amount_gross.toNumber();
      const recurrenceType = e.recurrence_type as RecurrenceType;
      return {
        expenseId: e.id,
        name: e.name,
        categoryLabel: e.category.name,
        amountNet,
        vatRate,
        amountGross,
        recurrenceType,
        annualAmountNet: annualizeExpense(amountNet, recurrenceType),
        isStructural: true,
        sortOrder: i,
      };
    });

  // Create budget with all lines in a transaction
  const created = await prisma.budget.create({
    data: {
      pharmacyId: input.pharmacyId,
      name: input.name,
      year: input.year,
      baselineSource: input.baselineSource,
      baselineYear: input.baselineYear,
      globalAdjustmentPct: input.globalAdjustmentPct,
      notes: input.notes,
      revenueLines: { createMany: { data: revenueLineData } },
      expenseLines: { createMany: { data: expenseLineData } },
    },
    include: {
      revenueLines: { orderBy: { sortOrder: "asc" } },
      expenseLines: { orderBy: { sortOrder: "asc" } },
    },
  });

  const budget = serializeBudget(created);
  return { budget, summary: buildSummary(budget) };
}

// ─── Update ───────────────────────────────────────────

export interface UpdateBudgetInput {
  name?: string;
  notes?: string | null;
  globalAdjustmentPct?: number | null;
  status?: BudgetStatus;
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput
): Promise<{ budget: Budget; summary: BudgetSummary } | null> {
  const existing = await prisma.budget.findUnique({
    where: { id },
    include: { revenueLines: true, expenseLines: true },
  });
  if (!existing) return null;

  // If globalAdjustmentPct changed, recalculate all revenue lines
  const globalPctChanged =
    input.globalAdjustmentPct !== undefined &&
    input.globalAdjustmentPct !== existing.globalAdjustmentPct?.toNumber();

  const data: Prisma.BudgetUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.globalAdjustmentPct !== undefined)
    data.globalAdjustmentPct = input.globalAdjustmentPct;
  if (input.status !== undefined) data.status = input.status;

  if (globalPctChanged && input.globalAdjustmentPct !== null) {
    // Recalculate all revenue lines using global pct
    await prisma.$transaction(async (tx) => {
      await tx.budget.update({ where: { id }, data });

      for (const line of existing.revenueLines) {
        const forecast = computeRevenueLine(
          line.baselineRevenue.toNumber(),
          line.baselineMarginPct.toNumber(),
          "PCT_CHANGE",
          input.globalAdjustmentPct!
        );
        await tx.budgetRevenueLine.update({
          where: { id: line.id },
          data: {
            forecastRevenue: forecast.forecastRevenue,
            forecastCOGS: forecast.forecastCOGS,
            forecastMargin: forecast.forecastMargin,
          },
        });
      }
    });
  } else {
    await prisma.budget.update({ where: { id }, data });
  }

  return getBudgetById(id);
}

// ─── Delete ───────────────────────────────────────────

export async function deleteBudget(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Budget non trovato" };

  if (existing.status !== "DRAFT") {
    return {
      success: false,
      error: "Solo i budget in stato DRAFT possono essere eliminati.",
    };
  }

  await prisma.budget.delete({ where: { id } });
  return { success: true };
}

// ─── Revenue Lines ────────────────────────────────────

export interface UpdateRevenueLinesInput {
  globalAdjustmentPct?: number | null;
  lines?: Array<{
    id: string;
    adjustmentMode: AdjustmentMode;
    adjustmentPct?: number;
    adjustmentAbsolute?: number;
  }>;
}

export async function updateRevenueLines(
  budgetId: string,
  input: UpdateRevenueLinesInput
): Promise<{
  revenueLines: BudgetRevenueLine[];
  summary: BudgetSummary;
} | null> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { revenueLines: true, expenseLines: true },
  });
  if (!budget) return null;

  await prisma.$transaction(async (tx) => {
    if (input.globalAdjustmentPct !== undefined && input.globalAdjustmentPct !== null) {
      // Global mode: update budget + recalculate all lines
      await tx.budget.update({
        where: { id: budgetId },
        data: { globalAdjustmentPct: input.globalAdjustmentPct },
      });

      for (const line of budget.revenueLines) {
        const forecast = computeRevenueLine(
          line.baselineRevenue.toNumber(),
          line.baselineMarginPct.toNumber(),
          "PCT_CHANGE",
          input.globalAdjustmentPct
        );
        await tx.budgetRevenueLine.update({
          where: { id: line.id },
          data: {
            forecastRevenue: forecast.forecastRevenue,
            forecastCOGS: forecast.forecastCOGS,
            forecastMargin: forecast.forecastMargin,
          },
        });
      }
    } else if (input.lines && input.lines.length > 0) {
      // Individual mode: clear global, update each line
      await tx.budget.update({
        where: { id: budgetId },
        data: { globalAdjustmentPct: null },
      });

      for (const lineInput of input.lines) {
        const existingLine = budget.revenueLines.find(
          (l) => l.id === lineInput.id
        );
        if (!existingLine) continue;

        const forecast = computeRevenueLine(
          existingLine.baselineRevenue.toNumber(),
          existingLine.baselineMarginPct.toNumber(),
          lineInput.adjustmentMode,
          lineInput.adjustmentPct,
          lineInput.adjustmentAbsolute
        );

        await tx.budgetRevenueLine.update({
          where: { id: lineInput.id },
          data: {
            adjustmentMode: lineInput.adjustmentMode,
            adjustmentPct: lineInput.adjustmentPct ?? null,
            adjustmentAbsolute: lineInput.adjustmentAbsolute ?? null,
            forecastRevenue: forecast.forecastRevenue,
            forecastCOGS: forecast.forecastCOGS,
            forecastMargin: forecast.forecastMargin,
          },
        });
      }
    }
  });

  // Re-fetch to get updated state
  const updated = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      revenueLines: { orderBy: { sortOrder: "asc" } },
      expenseLines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!updated) return null;

  const serialized = serializeBudget(updated);
  return {
    revenueLines: serialized.revenueLines,
    summary: buildSummary(serialized),
  };
}

// ─── Expense Lines ────────────────────────────────────

export interface CreateExpenseLineInput {
  name: string;
  categoryLabel: string;
  amountNet: number;
  vatRate: number;
  recurrenceType: RecurrenceType;
  notes?: string;
}

export async function createExpenseLine(
  budgetId: string,
  input: CreateExpenseLineInput
): Promise<{
  expenseLine: BudgetExpenseLine;
  summary: BudgetSummary;
} | null> {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!budget) return null;

  const amountGross =
    Math.round(input.amountNet * (1 + input.vatRate / 100) * 100) / 100;
  const annualAmountNet = annualizeExpense(
    input.amountNet,
    input.recurrenceType
  );

  // Get next sort order
  const lastLine = await prisma.budgetExpenseLine.findFirst({
    where: { budgetId },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastLine?.sortOrder ?? -1) + 1;

  const created = await prisma.budgetExpenseLine.create({
    data: {
      budgetId,
      name: input.name,
      categoryLabel: input.categoryLabel,
      amountNet: input.amountNet,
      vatRate: input.vatRate,
      amountGross,
      recurrenceType: input.recurrenceType,
      annualAmountNet,
      isStructural: false,
      notes: input.notes,
      sortOrder,
    },
  });

  const result = await getBudgetById(budgetId);
  if (!result) return null;

  return {
    expenseLine: serializeExpenseLine(created),
    summary: result.summary,
  };
}

export interface UpdateExpenseLineInput {
  name?: string;
  categoryLabel?: string;
  amountNet?: number;
  vatRate?: number;
  recurrenceType?: RecurrenceType;
  notes?: string | null;
}

export async function updateExpenseLine(
  budgetId: string,
  lineId: string,
  input: UpdateExpenseLineInput
): Promise<{
  expenseLine: BudgetExpenseLine;
  summary: BudgetSummary;
} | null> {
  const line = await prisma.budgetExpenseLine.findFirst({
    where: { id: lineId, budgetId },
  });
  if (!line) return null;

  if (line.isStructural) {
    throw new ValidationError(
      "Le voci di spesa strutturali non possono essere modificate. Modifica la spesa originale nel modulo Spese."
    );
  }

  const newNet = input.amountNet ?? line.amountNet.toNumber();
  const newRate = input.vatRate ?? line.vatRate.toNumber();
  const newRecurrence = (input.recurrenceType ??
    line.recurrenceType) as RecurrenceType;

  const amountGross = Math.round(newNet * (1 + newRate / 100) * 100) / 100;
  const annualAmountNet = annualizeExpense(newNet, newRecurrence);

  const updated = await prisma.budgetExpenseLine.update({
    where: { id: lineId },
    data: {
      name: input.name ?? line.name,
      categoryLabel: input.categoryLabel ?? line.categoryLabel,
      amountNet: newNet,
      vatRate: newRate,
      amountGross,
      recurrenceType: newRecurrence,
      annualAmountNet,
      notes: input.notes !== undefined ? input.notes : line.notes,
    },
  });

  const result = await getBudgetById(budgetId);
  if (!result) return null;

  return {
    expenseLine: serializeExpenseLine(updated),
    summary: result.summary,
  };
}

export async function deleteExpenseLine(
  budgetId: string,
  lineId: string
): Promise<{ success: boolean; summary?: BudgetSummary; error?: string }> {
  const line = await prisma.budgetExpenseLine.findFirst({
    where: { id: lineId, budgetId },
  });
  if (!line) return { success: false, error: "Voce di spesa non trovata" };

  if (line.isStructural) {
    return {
      success: false,
      error:
        "Le voci di spesa strutturali non possono essere eliminate dal budget.",
    };
  }

  await prisma.budgetExpenseLine.delete({ where: { id: lineId } });

  const result = await getBudgetById(budgetId);
  return { success: true, summary: result?.summary };
}

// ─── Custom error class ───────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
