-- DropIndex
DROP INDEX "ai_area_reports_municipality_code_key";

-- AlterTable
ALTER TABLE "ai_area_reports" ADD COLUMN "period" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ai_area_reports_municipality_code_period_key" ON "ai_area_reports"("municipality_code", "period");
