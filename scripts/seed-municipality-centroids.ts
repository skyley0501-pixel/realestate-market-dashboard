// public/geo/kanto-municipalities.geojson（地図表示用の市区町村ポリゴン、国土数値情報 行政区域データ由来）から
// 各市区町村の代表点（バウンディングボックス中心）を算出し、Municipality.latitude/longitudeに保存するバッチ。
// ハザード判定API（タイル座標指定）の起点として使う。地図の形データが変わらない限り再実行不要。
// 実行例: npm run seed:municipality-centroids
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { boundingBoxCenter, type GeoJsonFeatureLike } from "./geo-tile-utils.ts";

const GEOJSON_PATH = path.join(process.cwd(), "public", "geo", "kanto-municipalities.geojson");

async function loadMunicipalityFeatures(): Promise<GeoJsonFeatureLike[]> {
  const raw = await readFile(GEOJSON_PATH, "utf-8");
  const geo = JSON.parse(raw) as { features: GeoJsonFeatureLike[] };
  return geo.features;
}

async function main() {
  const features = await loadMunicipalityFeatures();

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  let skipped = 0;

  for (const feature of features) {
    const code = feature.properties.N03_007;
    if (typeof code !== "string" || code === "") {
      skipped++;
      continue;
    }

    const { longitude, latitude } = boundingBoxCenter(feature);
    const result = await prisma.municipality.updateMany({
      where: { code },
      data: { latitude, longitude },
    });
    if (result.count === 0) {
      // geojsonにはあるがDBのMunicipalityマスタに未登録のコード（対象エリア外等）
      skipped++;
      continue;
    }
    updated++;
  }

  console.log(`完了: ${updated}件更新 / ${skipped}件スキップ（コード欠損またはDB未登録）`);
  await prisma.$disconnect();
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
