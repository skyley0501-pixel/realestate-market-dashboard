-- CreateTable
CREATE TABLE "jgb_yields" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ten_year_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jgb_yields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rates" (
    "id" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "rate_percent" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jgb_yields_date_key" ON "jgb_yields"("date");

-- CreateIndex
CREATE UNIQUE INDEX "policy_rates_effective_date_key" ON "policy_rates"("effective_date");

-- 公開統計データテーブルのため、既存方針（RLS: 読み取りのみ許可、書き込みはpostgresロール経由のみ）に合わせる
ALTER TABLE "jgb_yields" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "jgb_yields" FOR SELECT USING (true);

ALTER TABLE "policy_rates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "policy_rates" FOR SELECT USING (true);
