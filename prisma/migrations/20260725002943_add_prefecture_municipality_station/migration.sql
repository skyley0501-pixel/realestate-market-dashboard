-- CreateTable
CREATE TABLE "prefectures" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefecture_code" TEXT NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT,
    "municipality_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_name_line_key" ON "stations"("name", "line");

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_municipality_code_fkey" FOREIGN KEY ("municipality_code") REFERENCES "municipalities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
