-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('MANUAL', 'INVOICE', 'IMPORT');

-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('IMPORTED', 'MATCHED', 'RECONCILED', 'REJECTED');

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "ragione_sociale" TEXT NOT NULL,
    "piva" TEXT,
    "codice_fiscale" TEXT,
    "sdi_code" TEXT,
    "iban" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "amount_net" DECIMAL(10,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 22,
    "amount_gross" DECIMAL(10,2) NOT NULL,
    "is_vat_deductible" BOOLEAN NOT NULL DEFAULT true,
    "recurrence_type" "RecurrenceType" NOT NULL DEFAULT 'MONTHLY',
    "is_fixed_cost" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL',
    "passive_invoice_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRecurringInstance" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "period_month" TIMESTAMP(3) NOT NULL,
    "amount_net_override" DECIMAL(10,2),
    "status" "InstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRecurringInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassiveInvoice" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "sdi_id" TEXT,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "taxable_amount" DECIMAL(10,2),
    "vat_amount" DECIMAL(10,2),
    "total_amount" DECIMAL(10,2),
    "xml_raw" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'IMPORTED',
    "expense_id" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassiveInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Supplier_pharmacy_id_idx" ON "Supplier"("pharmacy_id");

-- CreateIndex
CREATE INDEX "Expense_pharmacy_id_idx" ON "Expense"("pharmacy_id");

-- CreateIndex
CREATE INDEX "Expense_category_id_idx" ON "Expense"("category_id");

-- CreateIndex
CREATE INDEX "Expense_deleted_at_idx" ON "Expense"("deleted_at");

-- CreateIndex
CREATE INDEX "ExpenseRecurringInstance_expense_id_idx" ON "ExpenseRecurringInstance"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseRecurringInstance_expense_id_period_month_key" ON "ExpenseRecurringInstance"("expense_id", "period_month");

-- CreateIndex
CREATE INDEX "PassiveInvoice_pharmacy_id_idx" ON "PassiveInvoice"("pharmacy_id");

-- CreateIndex
CREATE INDEX "PassiveInvoice_status_idx" ON "PassiveInvoice"("status");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRecurringInstance" ADD CONSTRAINT "ExpenseRecurringInstance_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
