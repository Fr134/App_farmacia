-- CreateTable
CREATE TABLE "SivatAssessment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "score_a" INTEGER NOT NULL,
    "score_b" INTEGER NOT NULL,
    "score_c" INTEGER NOT NULL,
    "score_d" INTEGER NOT NULL,
    "score_e" INTEGER,
    "section_e_enabled" BOOLEAN NOT NULL DEFAULT false,
    "support_level" INTEGER,
    "total_score" INTEGER NOT NULL,
    "raw_score" INTEGER NOT NULL,
    "max_possible" INTEGER NOT NULL,
    "classification" TEXT NOT NULL,
    "pdc_percentage" DECIMAL(5,1),
    "pdc_days_covered" INTEGER,
    "pdc_days_observed" INTEGER,
    "answers" JSONB NOT NULL,
    "criticalities" JSONB NOT NULL,
    "interventions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SivatAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SivatAssessment_user_id_idx" ON "SivatAssessment"("user_id");

-- CreateIndex
CREATE INDEX "SivatAssessment_patient_name_idx" ON "SivatAssessment"("patient_name");

-- CreateIndex
CREATE INDEX "SivatAssessment_classification_idx" ON "SivatAssessment"("classification");

-- CreateIndex
CREATE INDEX "SivatAssessment_created_at_idx" ON "SivatAssessment"("created_at");

-- AddForeignKey
ALTER TABLE "SivatAssessment" ADD CONSTRAINT "SivatAssessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
