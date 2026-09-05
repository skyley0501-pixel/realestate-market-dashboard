-- CreateTable
CREATE TABLE "condo_supply_stats" (
    "id" TEXT NOT NULL,
    "prefecture_code" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "units_started" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condo_supply_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condo_market_stats" (
    "id" TEXT NOT NULL,
    "prefecture_code" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "median_price_yen" BIGINT NOT NULL,
    "average_price_yen" BIGINT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "transaction_count" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condo_market_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "condo_supply_stats_prefecture_code_fiscal_year_key" ON "condo_supply_stats"("prefecture_code", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "condo_market_stats_prefecture_code_period_key" ON "condo_market_stats"("prefecture_code", "period");

-- CreateIndex
CREATE INDEX "condo_market_stats_period_idx" ON "condo_market_stats"("period");

-- AddForeignKey
ALTER TABLE "condo_supply_stats" ADD CONSTRAINT "condo_supply_stats_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condo_market_stats" ADD CONSTRAINT "condo_market_stats_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 公開統計データテーブルのため、既存方針（RLS: 読み取りのみ許可、書き込みはpostgresロール経由のみ）に合わせる
ALTER TABLE "condo_supply_stats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "condo_supply_stats" FOR SELECT USING (true);

ALTER TABLE "condo_market_stats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "condo_market_stats" FOR SELECT USING (true);
