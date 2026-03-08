-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BaselineSource" AS ENUM ('HISTORICAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdjustmentMode" AS ENUM ('PCT_CHANGE', 'ABSOLUTE', 'NO_CHANGE');

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "baselineSource" "BaselineSource" NOT NULL DEFAULT 'HISTORICAL',
    "baselineYear" INTEGER,
    "globalAdjustmentPct" DECIMAL(6,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRevenueLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "baselineRevenue" DECIMAL(12,2) NOT NULL,
    "baselineMarginPct" DECIMAL(6,4) NOT NULL,
    "baselinePieces" INTEGER,
    "adjustmentMode" "AdjustmentMode" NOT NULL DEFAULT 'PCT_CHANGE',
    "adjustmentPct" DECIMAL(6,2),
    "adjustmentAbsolute" DECIMAL(12,2),
    "forecastRevenue" DECIMAL(12,2) NOT NULL,
    "forecastCOGS" DECIMAL(12,2) NOT NULL,
    "forecastMargin" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetRevenueLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetExpenseLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "expenseId" TEXT,
    "name" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "amountNet" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 22,
    "amountGross" DECIMAL(10,2) NOT NULL,
    "recurrenceType" "RecurrenceType" NOT NULL,
    "annualAmountNet" DECIMAL(10,2) NOT NULL,
    "isStructural" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetExpenseLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budget_pharmacyId_year_idx" ON "Budget"("pharmacyId", "year");

-- CreateIndex
CREATE INDEX "BudgetRevenueLine_budgetId_idx" ON "BudgetRevenueLine"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetRevenueLine_budgetId_categoryLabel_key" ON "BudgetRevenueLine"("budgetId", "categoryLabel");

-- CreateIndex
CREATE INDEX "BudgetExpenseLine_budgetId_idx" ON "BudgetExpenseLine"("budgetId");

-- AddForeignKey
ALTER TABLE "BudgetRevenueLine" ADD CONSTRAINT "BudgetRevenueLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetExpenseLine" ADD CONSTRAINT "BudgetExpenseLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
