// 市区町村ごとに洪水浸水想定区域（XKT026）・土砂災害警戒区域（XKT029）の該当有無を判定し、
// HazardZoneテーブルへ保存するバッチスクリプト。
// 実行例: npm run fetch:hazard-zones
//
// 判定方法: 市区町村の代表点（重心）を中心にした3x3タイル（z=14, 1タイル約2.4km四方）のいずれかに
// 区域のfeatureが1件でもあれば「該当あり」とする簡易判定。区域が代表点から離れた場所にしか
// 無い広い市区町村は見落とす可能性があるため、粗い傾向把握が目的（GPTレビュー等で精度向上を検討）。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { lonLatToTile, surroundingTiles } from "./geo-tile-utils.ts";
import { fetchHazardTileFeatures } from "./reinfolib-hazard-client.ts";

const ZOOM = 14;
const TILE_RADIUS = 1; // 3x3タイル
const REQUEST_INTERVAL_MS = 150; // reinfolib APIへの過度な連続リクエストを避けるための間隔

const FLOOD_API_ID = "XKT026";
const LANDSLIDE_API_ID = "XKT029";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasAnyFeature(apiId: string, lon: number, lat: number, apiKey: string): Promise<boolean> {
  const centerTile = lonLatToTile(lon, lat, ZOOM);
  for (const tile of surroundingTiles(centerTile, TILE_RADIUS)) {
    const features = await fetchHazardTileFeatures(apiId, tile, apiKey);
    await sleep(REQUEST_INTERVAL_MS);
    if (features.length > 0) return true;
  }
  return false;
}

async function main() {
  const apiKey = process.env.REINFOLIB_API_KEY;
  if (!apiKey) {
    throw new Error("REINFOLIB_API_KEY が未設定です。.env に設定してください。");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const municipalities = await prisma.municipality.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { code: true, name: true, latitude: true, longitude: true },
  });

  console.log(`対象市区町村: ${municipalities.length}件（代表点未設定のものはスキップ）`);

  let processed = 0;
  for (const m of municipalities) {
    // reinfolib APIへの同時リクエストを増やしすぎないよう、洪水→土砂災害の順に直列で呼ぶ
    const floodZone = await hasAnyFeature(FLOOD_API_ID, m.longitude!, m.latitude!, apiKey);
    const landslideZone = await hasAnyFeature(LANDSLIDE_API_ID, m.longitude!, m.latitude!, apiKey);

    await prisma.hazardZone.upsert({
      where: { municipalityCode: m.code },
      create: { municipalityCode: m.code, floodZone, landslideZone },
      update: { floodZone, landslideZone, checkedAt: new Date() },
    });

    processed++;
    console.log(`[${processed}/${municipalities.length}] ${m.name}: 洪水=${floodZone} 土砂災害=${landslideZone}`);
  }

  console.log("完了");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
