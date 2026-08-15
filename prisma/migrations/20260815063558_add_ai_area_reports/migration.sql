-- CreateTable
CREATE TABLE "ai_area_reports" (
    "id" TEXT NOT NULL,
    "municipality_code" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_area_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_area_reports_municipality_code_key" ON "ai_area_reports"("municipality_code");

-- AddForeignKey
ALTER TABLE "ai_area_reports" ADD CONSTRAINT "ai_area_reports_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
