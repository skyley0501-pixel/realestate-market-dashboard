-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "municipality_code" TEXT NOT NULL,
    "station_id" TEXT,
    "time_to_station_minutes" INTEGER,
    "transaction_period" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "price_yen" BIGINT NOT NULL,
    "area_sqm" DOUBLE PRECISION NOT NULL,
    "floor_plan" TEXT,
    "building_year" INTEGER,
    "structure" TEXT,
    "use" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_municipality_code_idx" ON "transactions"("municipality_code");

-- CreateIndex
CREATE INDEX "transactions_station_id_idx" ON "transactions"("station_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_period_idx" ON "transactions"("transaction_period");

-- CreateIndex
CREATE INDEX "transactions_property_type_idx" ON "transactions"("property_type");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
