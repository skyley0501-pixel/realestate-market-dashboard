-- AlterTable
ALTER TABLE "municipalities" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "municipalities" ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "hazard_zones" (
    "id" TEXT NOT NULL,
    "municipality_code" TEXT NOT NULL,
    "flood_zone" BOOLEAN NOT NULL,
    "landslide_zone" BOOLEAN NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hazard_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disaster_histories" (
    "id" TEXT NOT NULL,
    "municipality_code" TEXT NOT NULL,
    "disaster_type_code" TEXT NOT NULL,
    "disaster_name" TEXT NOT NULL,
    "occurred_on" DATE NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disaster_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hazard_zones_municipality_code_key" ON "hazard_zones"("municipality_code");

-- CreateIndex
CREATE INDEX "disaster_histories_municipality_code_idx" ON "disaster_histories"("municipality_code");

-- CreateIndex
CREATE UNIQUE INDEX "disaster_histories_municipality_code_disaster_type_code_o_key" ON "disaster_histories"("municipality_code", "disaster_type_code", "occurred_on");

-- AddForeignKey
ALTER TABLE "hazard_zones" ADD CONSTRAINT "hazard_zones_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disaster_histories" ADD CONSTRAINT "disaster_histories_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 公開統計データテーブルのため、既存方針（RLS: 読み取りのみ許可、書き込みはpostgresロール経由のみ）に合わせる
ALTER TABLE "hazard_zones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "hazard_zones" FOR SELECT USING (true);

ALTER TABLE "disaster_histories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "disaster_histories" FOR SELECT USING (true);
