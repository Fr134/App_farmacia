-- Step 1: Create Pharmacy table
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- Step 2: Insert default pharmacy for existing data
INSERT INTO "Pharmacy" ("id", "name", "created_at")
VALUES ('default-pharmacy', 'Farmacia Predefinita', CURRENT_TIMESTAMP);

-- Step 3: Add pharmacy_id columns (nullable first for backfill)
ALTER TABLE "User" ADD COLUMN "pharmacy_id" TEXT;
ALTER TABLE "Report" ADD COLUMN "pharmacy_id" TEXT;
ALTER TABLE "SivatAssessment" ADD COLUMN "pharmacy_id" TEXT;
ALTER TABLE "ExpenseCategory" ADD COLUMN "pharmacy_id" TEXT;

-- Step 4: Backfill all rows with default pharmacy
UPDATE "User" SET "pharmacy_id" = 'default-pharmacy';
UPDATE "Report" SET "pharmacy_id" = 'default-pharmacy';
UPDATE "SivatAssessment" SET "pharmacy_id" = 'default-pharmacy';
UPDATE "ExpenseCategory" SET "pharmacy_id" = 'default-pharmacy';

-- Step 5: Update existing pharmacy_id="default" to real pharmacy id
UPDATE "Expense" SET "pharmacy_id" = 'default-pharmacy' WHERE "pharmacy_id" = 'default';
UPDATE "Supplier" SET "pharmacy_id" = 'default-pharmacy' WHERE "pharmacy_id" = 'default';
UPDATE "Budget" SET "pharmacyId" = 'default-pharmacy' WHERE "pharmacyId" = 'default';
UPDATE "PassiveInvoice" SET "pharmacy_id" = 'default-pharmacy' WHERE "pharmacy_id" = 'default';

-- Step 6: Make columns NOT NULL
ALTER TABLE "User" ALTER COLUMN "pharmacy_id" SET NOT NULL;
ALTER TABLE "Report" ALTER COLUMN "pharmacy_id" SET NOT NULL;
ALTER TABLE "SivatAssessment" ALTER COLUMN "pharmacy_id" SET NOT NULL;
ALTER TABLE "ExpenseCategory" ALTER COLUMN "pharmacy_id" SET NOT NULL;

-- Step 7: Drop old unique constraints on Report
DROP INDEX IF EXISTS "Report_file_hash_key";
DROP INDEX IF EXISTS "Report_period_month_period_year_key";

-- Step 8: Drop old unique constraint on ExpenseCategory
DROP INDEX IF EXISTS "ExpenseCategory_name_key";

-- Step 9: Add FK constraints
ALTER TABLE "User" ADD CONSTRAINT "User_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SivatAssessment" ADD CONSTRAINT "SivatAssessment_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PassiveInvoice" ADD CONSTRAINT "PassiveInvoice_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Add new compound unique constraints
CREATE UNIQUE INDEX "Report_pharmacy_id_file_hash_key" ON "Report"("pharmacy_id", "file_hash");
CREATE UNIQUE INDEX "Report_pharmacy_id_period_month_period_year_key" ON "Report"("pharmacy_id", "period_month", "period_year");
CREATE UNIQUE INDEX "ExpenseCategory_pharmacy_id_name_key" ON "ExpenseCategory"("pharmacy_id", "name");

-- Step 11: Add indexes
CREATE INDEX "User_pharmacy_id_idx" ON "User"("pharmacy_id");
CREATE INDEX "Report_pharmacy_id_idx" ON "Report"("pharmacy_id");
CREATE INDEX "SivatAssessment_pharmacy_id_idx" ON "SivatAssessment"("pharmacy_id");
CREATE INDEX "ExpenseCategory_pharmacy_id_idx" ON "ExpenseCategory"("pharmacy_id");
