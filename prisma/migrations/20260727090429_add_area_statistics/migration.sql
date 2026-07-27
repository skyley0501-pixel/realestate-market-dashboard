-- CreateTable
CREATE TABLE "area_statistics" (
    "id" TEXT NOT NULL,
    "municipality_code" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "median_price_yen" BIGINT NOT NULL,
    "average_price_yen" BIGINT NOT NULL,
    "q1_price_yen" BIGINT NOT NULL,
    "q3_price_yen" BIGINT NOT NULL,
    "avg_unit_price_yen_per_sqm" DOUBLE PRECISION NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "transaction_count" INTEGER NOT NULL,
    "yoy_change_rate_percent" DOUBLE PRECISION,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "area_statistics_period_idx" ON "area_statistics"("period");

-- CreateIndex
CREATE UNIQUE INDEX "area_statistics_municipality_code_period_key" ON "area_statistics"("municipality_code", "period");

-- AddForeignKey
ALTER TABLE "area_statistics" ADD CONSTRAINT "area_statistics_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
