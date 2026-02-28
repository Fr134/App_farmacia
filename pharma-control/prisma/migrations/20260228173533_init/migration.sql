-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_revenue_gross" DECIMAL(12,2) NOT NULL,
    "total_revenue_net" DECIMAL(12,2) NOT NULL,
    "total_iva" DECIMAL(12,2) NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "total_margin" DECIMAL(12,2) NOT NULL,
    "total_margin_pct" DECIMAL(5,2) NOT NULL,
    "total_markup_pct" DECIMAL(5,2) NOT NULL,
    "total_pieces" INTEGER NOT NULL,
    "total_sales" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorData" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "tipologia" TEXT NOT NULL,
    "valore" DECIMAL(12,2) NOT NULL,
    "valore_pct" DECIMAL(5,2),
    "media_pezzi" DECIMAL(8,2),
    "pezzi" INTEGER NOT NULL DEFAULT 0,
    "pezzi_pct" DECIMAL(5,2),
    "n_vendite" INTEGER NOT NULL DEFAULT 0,
    "vendite_pct" DECIMAL(5,2),
    "costo_venduto" DECIMAL(12,2),
    "margine" DECIMAL(12,2),
    "margine_tot_pct" DECIMAL(5,2),
    "margine_pct" DECIMAL(6,2),
    "ricarico_pct" DECIMAL(6,2),
    "pezzi_ricetta" INTEGER DEFAULT 0,
    "pezzi_ricetta_pct" DECIMAL(5,2),
    "pezzi_libera" INTEGER DEFAULT 0,
    "pezzi_libera_pct" DECIMAL(5,2),
    "pezzi_fidelity" INTEGER DEFAULT 0,
    "pezzi_fidelity_pct" DECIMAL(5,2),
    "valore_ricetta" DECIMAL(12,2),
    "valore_ricetta_pct" DECIMAL(5,2),
    "valore_libera" DECIMAL(12,2),
    "valore_libera_pct" DECIMAL(5,2),
    "valore_fidelity" DECIMAL(12,2),
    "valore_fidelity_pct" DECIMAL(5,2),
    "imponibile" DECIMAL(12,2),
    "imponibile_pct" DECIMAL(5,2),
    "iva" DECIMAL(12,2),
    "iva_pct" DECIMAL(5,2),

    CONSTRAINT "SectorData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_file_hash_key" ON "Report"("file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Report_period_month_period_year_key" ON "Report"("period_month", "period_year");

-- CreateIndex
CREATE INDEX "SectorData_report_id_idx" ON "SectorData"("report_id");

-- AddForeignKey
ALTER TABLE "SectorData" ADD CONSTRAINT "SectorData_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
