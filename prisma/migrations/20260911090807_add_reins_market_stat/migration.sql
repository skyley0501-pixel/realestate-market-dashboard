-- CreateTable
CREATE TABLE "reins_market_stats" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "contract_count" INTEGER NOT NULL,
    "contract_unit_price_man_yen" DOUBLE PRECISION,
    "contract_price_man_yen" DOUBLE PRECISION NOT NULL,
    "new_listing_unit_price_man_yen" DOUBLE PRECISION,
    "inventory_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reins_market_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reins_market_stats_region_property_type_idx" ON "reins_market_stats"("region", "property_type");

-- CreateIndex
CREATE UNIQUE INDEX "reins_market_stats_period_region_property_type_key" ON "reins_market_stats"("period", "region", "property_type");

-- RenameIndex
ALTER INDEX "disaster_histories_municipality_code_disaster_type_code_o_key" RENAME TO "disaster_histories_municipality_code_disaster_type_code_occ_key";
