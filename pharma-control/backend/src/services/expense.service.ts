import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  Expense,
  ExpenseCategory,
  Supplier,
  ExpenseSummary,
  RecurrenceType,
} from "../types";

// ─── Prisma type helpers ──────────────────────────────

type PrismaExpense = Prisma.ExpenseGetPayload<{
  include: { category: true; supplier: true };
}>;

type PrismaExpenseCategory = Prisma.ExpenseCategoryGetPayload<object>;
type PrismaSupplier = Prisma.SupplierGetPayload<object>;

// ─── Serializers (Decimal → number, snake_case → camelCase) ──

function serializeCategory(c: PrismaExpenseCategory): ExpenseCategory {
  return {
    id: c.id,
    name: c.name,
    color: c.color ?? undefined,
    icon: c.icon ?? undefined,
    isSystem: c.is_system,
  };
}

function serializeSupplier(s: PrismaSupplier): Supplier {
  return {
    id: s.id,
    pharmacyId: s.pharmacy_id,
    ragioneSociale: s.ragione_sociale,
    piva: s.piva ?? undefined,
    codiceFiscale: s.codice_fiscale ?? undefined,
    email: s.email ?? undefined,
    phone: s.phone ?? undefined,
    notes: s.notes ?? undefined,
  };
}

function serializeExpense(e: PrismaExpense): Expense {
  return {
    id: e.id,
    pharmacyId: e.pharmacy_id,
    name: e.name,
    description: e.description ?? undefined,
    category: serializeCategory(e.category),
    categoryId: e.category_id,
    supplier: e.supplier ? serializeSupplier(e.supplier) : undefined,
    supplierId: e.supplier_id ?? undefined,
    amountNet: e.amount_net.toNumber(),
    vatRate: e.vat_rate.toNumber(),
    amountGross: e.amount_gross.toNumber(),
    isVatDeductible: e.is_vat_deductible,
    recurrenceType: e.recurrence_type as RecurrenceType,
    isFixedCost: e.is_fixed_cost,
    validFrom: e.valid_from.toISOString(),
    validTo: e.valid_to?.toISOString() ?? undefined,
    source: e.source as Expense["source"],
    passiveInvoiceId: e.passive_invoice_id ?? undefined,
    notes: e.notes ?? undefined,
    createdAt: e.created_at.toISOString(),
    updatedAt: e.updated_at.toISOString(),
    deletedAt: e.deleted_at?.toISOString() ?? undefined,
  };
}

// ─── Monthly normalization ────────────────────────────

function normalizeToMonthly(amountNet: number, recurrenceType: string): number {
  switch (recurrenceType) {
    case "MONTHLY":
      return amountNet;
    case "QUARTERLY":
      return amountNet / 3;
    case "ANNUAL":
      return amountNet / 12;
    case "NONE":
      return 0;
    default:
      return 0;
  }
}

// ─── Categories ───────────────────────────────────────

export async function getAllCategories(): Promise<ExpenseCategory[]> {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map(serializeCategory);
}

// ─── Expenses ─────────────────────────────────────────

export async function getExpenses(
  pharmacyId: string,
  filters?: { categoryId?: string; recurrenceType?: string }
): Promise<{ expenses: Expense[]; totalMonthlyNet: number; totalMonthlyGross: number }> {
  const where: Prisma.ExpenseWhereInput = {
    pharmacy_id: pharmacyId,
    deleted_at: null,
  };

  if (filters?.categoryId) {
    where.category_id = filters.categoryId;
  }
  if (filters?.recurrenceType) {
    where.recurrence_type = filters.recurrenceType as Prisma.EnumRecurrenceTypeFilter["equals"];
  }

  const rows = await prisma.expense.findMany({
    where,
    include: { category: true, supplier: true },
    orderBy: { created_at: "desc" },
  });

  const expenses = rows.map(serializeExpense);

  let totalMonthlyNet = 0;
  let totalMonthlyGross = 0;
  for (const e of expenses) {
    const monthlyNet = normalizeToMonthly(e.amountNet, e.recurrenceType);
    totalMonthlyNet += monthlyNet;
    totalMonthlyGross += monthlyNet * (1 + e.vatRate / 100);
  }

  return {
    expenses,
    totalMonthlyNet: Math.round(totalMonthlyNet * 100) / 100,
    totalMonthlyGross: Math.round(totalMonthlyGross * 100) / 100,
  };
}

export async function getExpenseSummary(pharmacyId: string): Promise<ExpenseSummary> {
  const rows = await prisma.expense.findMany({
    where: { pharmacy_id: pharmacyId, deleted_at: null },
    include: { category: true },
  });

  let totalMonthlyNet = 0;
  let totalMonthlyGross = 0;
  let fixedCostsMonthly = 0;
  let variableCostsMonthly = 0;
  let deductibleVatMonthly = 0;

  const categoryMap = new Map<string, { categoryName: string; color: string; icon: string; total: number }>();

  for (const row of rows) {
    const net = row.amount_net.toNumber();
    const vatRate = row.vat_rate.toNumber();
    const monthly = normalizeToMonthly(net, row.recurrence_type);

    totalMonthlyNet += monthly;
    totalMonthlyGross += monthly * (1 + vatRate / 100);

    if (row.is_fixed_cost) {
      fixedCostsMonthly += monthly;
    } else if (row.recurrence_type !== "NONE") {
      variableCostsMonthly += monthly;
    }

    if (row.is_vat_deductible) {
      deductibleVatMonthly += monthly * (vatRate / 100);
    }

    const catName = row.category.name;
    const existing = categoryMap.get(catName);
    if (existing) {
      existing.total += monthly;
    } else {
      categoryMap.set(catName, {
        categoryName: catName,
        color: row.category.color ?? "#7b849a",
        icon: row.category.icon ?? "📦",
        total: monthly,
      });
    }
  }

  const byCategory = Array.from(categoryMap.values())
    .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  return {
    totalMonthlyNet: Math.round(totalMonthlyNet * 100) / 100,
    totalMonthlyGross: Math.round(totalMonthlyGross * 100) / 100,
    fixedCostsMonthly: Math.round(fixedCostsMonthly * 100) / 100,
    variableCostsMonthly: Math.round(variableCostsMonthly * 100) / 100,
    deductibleVatMonthly: Math.round(deductibleVatMonthly * 100) / 100,
    byCategory,
  };
}

export interface CreateExpenseInput {
  pharmacyId: string;
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

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const amountGross = Math.round(input.amountNet * (1 + input.vatRate / 100) * 100) / 100;

  const expense = await prisma.expense.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      description: input.description,
      category_id: input.categoryId,
      supplier_id: input.supplierId,
      amount_net: input.amountNet,
      vat_rate: input.vatRate,
      amount_gross: amountGross,
      is_vat_deductible: input.isVatDeductible,
      recurrence_type: input.recurrenceType,
      is_fixed_cost: input.isFixedCost,
      valid_from: new Date(input.validFrom),
      valid_to: input.validTo ? new Date(input.validTo) : null,
      source: "MANUAL",
      notes: input.notes,
    },
    include: { category: true, supplier: true },
  });

  // Generate recurring instances if applicable
  if (input.recurrenceType !== "NONE") {
    const instances = [];
    const startDate = new Date(input.validFrom);
    startDate.setUTCDate(1);
    startDate.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const month = new Date(startDate);
      month.setUTCMonth(month.getUTCMonth() + i);
      instances.push({
        expense_id: expense.id,
        period_month: month,
        status: "ACTIVE" as const,
      });
    }

    await prisma.expenseRecurringInstance.createMany({ data: instances });
  }

  return serializeExpense(expense);
}

export interface UpdateExpenseInput {
  name?: string;
  description?: string | null;
  categoryId?: string;
  supplierId?: string | null;
  amountNet?: number;
  vatRate?: number;
  isVatDeductible?: boolean;
  recurrenceType?: RecurrenceType;
  isFixedCost?: boolean;
  validFrom?: string;
  validTo?: string | null;
  notes?: string | null;
}

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<Expense | null> {
  // Check existence and not soft-deleted
  const existing = await prisma.expense.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) return null;

  const data: Prisma.ExpenseUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
  if (input.supplierId !== undefined) {
    data.supplier = input.supplierId ? { connect: { id: input.supplierId } } : { disconnect: true };
  }
  if (input.isVatDeductible !== undefined) data.is_vat_deductible = input.isVatDeductible;
  if (input.recurrenceType !== undefined) data.recurrence_type = input.recurrenceType;
  if (input.isFixedCost !== undefined) data.is_fixed_cost = input.isFixedCost;
  if (input.validFrom !== undefined) data.valid_from = new Date(input.validFrom);
  if (input.validTo !== undefined) data.valid_to = input.validTo ? new Date(input.validTo) : null;
  if (input.notes !== undefined) data.notes = input.notes;

  // Recalculate gross if net or rate changed
  const newNet = input.amountNet ?? existing.amount_net.toNumber();
  const newRate = input.vatRate ?? existing.vat_rate.toNumber();

  if (input.amountNet !== undefined) data.amount_net = input.amountNet;
  if (input.vatRate !== undefined) data.vat_rate = input.vatRate;

  if (input.amountNet !== undefined || input.vatRate !== undefined) {
    data.amount_gross = Math.round(newNet * (1 + newRate / 100) * 100) / 100;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data,
    include: { category: true, supplier: true },
  });

  return serializeExpense(updated);
}

export async function softDeleteExpense(id: string): Promise<Expense | null> {
  const existing = await prisma.expense.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) return null;

  const updated = await prisma.expense.update({
    where: { id },
    data: { deleted_at: new Date() },
    include: { category: true, supplier: true },
  });

  return serializeExpense(updated);
}

// ─── Suppliers ────────────────────────────────────────

export async function getSuppliers(pharmacyId: string): Promise<Supplier[]> {
  const rows = await prisma.supplier.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { ragione_sociale: "asc" },
  });
  return rows.map(serializeSupplier);
}

export interface CreateSupplierInput {
  pharmacyId: string;
  ragioneSociale: string;
  piva?: string;
  codiceFiscale?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const supplier = await prisma.supplier.create({
    data: {
      pharmacy_id: input.pharmacyId,
      ragione_sociale: input.ragioneSociale,
      piva: input.piva,
      codice_fiscale: input.codiceFiscale,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
    },
  });
  return serializeSupplier(supplier);
}
