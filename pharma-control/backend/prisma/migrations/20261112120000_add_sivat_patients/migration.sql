-- CreateTable
CREATE TABLE "SivatPatient" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birth_date" DATE,
    "phone" TEXT,
    "fiscal_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SivatPatient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SivatPatient_pharmacy_id_fiscal_code_key" ON "SivatPatient"("pharmacy_id", "fiscal_code");
CREATE INDEX "SivatPatient_pharmacy_id_idx" ON "SivatPatient"("pharmacy_id");
CREATE INDEX "SivatPatient_full_name_idx" ON "SivatPatient"("full_name");

ALTER TABLE "SivatPatient" ADD CONSTRAINT "SivatPatient_pharmacy_id_fkey"
    FOREIGN KEY ("pharmacy_id") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link assessments to patients
ALTER TABLE "SivatAssessment" ADD COLUMN "patient_id" TEXT;
CREATE INDEX "SivatAssessment_patient_id_idx" ON "SivatAssessment"("patient_id");

ALTER TABLE "SivatAssessment" ADD CONSTRAINT "SivatAssessment_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "SivatPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one patient per distinct (pharmacy, normalized name) from existing assessments
INSERT INTO "SivatPatient" ("id", "pharmacy_id", "full_name", "created_at", "updated_at")
SELECT
    'legacy_' || md5(g.pharmacy_id || '|' || g.norm_name),
    g.pharmacy_id,
    g.display_name,
    g.first_seen,
    g.first_seen
FROM (
    SELECT DISTINCT ON (pharmacy_id, lower(trim(patient_name)))
        pharmacy_id,
        lower(trim(patient_name)) AS norm_name,
        trim(patient_name) AS display_name,
        MIN(created_at) OVER (PARTITION BY pharmacy_id, lower(trim(patient_name))) AS first_seen
    FROM "SivatAssessment"
    ORDER BY pharmacy_id, lower(trim(patient_name)), created_at DESC
) g;

UPDATE "SivatAssessment" a
SET "patient_id" = 'legacy_' || md5(a.pharmacy_id || '|' || lower(trim(a.patient_name)));
