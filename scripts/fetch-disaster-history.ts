// 市区町村ごとに過去の水害・土砂災害履歴（XST001: 国土調査「土地履歴調査」由来）を取得し、
// DisasterHistoryテーブルへ保存するバッチスクリプト。
// 実行例: npm run fetch:disaster-history
//
// 対象は水害・土砂災害関連の種別のみ（地震・津波・液状化は今回のスコープ外）。
// 市区町村の代表点を中心にした3x3タイル（z=12, 1タイル約9.8km四方）で取得する。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.ts";
import { lonLatToTile, surroundingTiles } from "./geo-tile-utils.ts";
import { fetchHazardTileFeatures } from "./reinfolib-hazard-client.ts";

const ZOOM = 12;
const TILE_RADIUS = 1; // 3x3タイル
const REQUEST_INTERVAL_MS = 150;
const API_ID = "XST001";

// 11:浸水域 12:堤防決壊 13:高潮浸水 14:高潮破堤 21:がけ崩れ 22:地すべり 23:河道閉塞 24:土石流
const TARGET_DISASTER_TYPE_CODES = ["11", "12", "13", "14", "21", "22", "23", "24"];

interface DisasterHistoryFeatureProps {
  disastertype_code?: string;
  disaster_name_ja?: string;
  disaster_date?: string; // "YYYYMMDD"
  disaster_source?: string;
}

// APIレスポンスの被害範囲図形。種別によりPoint（がけ崩れ等の地点）とPolygon/MultiPolygon（浸水域等の範囲）が混在する
type DisasterGeometry = { type: string; coordinates: unknown } | null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// "YYYYMMDD" -> Date（日付部分が欠ける・不正な場合はnull）
function parseDisasterDate(value: string | undefined): Date | null {
  if (!value || !/^\d{8}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

interface DisasterRecord {
  disasterTypeCode: string;
  disasterName: string;
  occurredOn: Date;
  source: string | null;
  geometry: DisasterGeometry;
}

async function fetchDisasterRecords(lon: number, lat: number, apiKey: string): Promise<DisasterRecord[]> {
  const centerTile = lonLatToTile(lon, lat, ZOOM);
  const records: DisasterRecord[] = [];

  for (const tile of surroundingTiles(centerTile, TILE_RADIUS)) {
    const features = await fetchHazardTileFeatures(API_ID, tile, apiKey, {
      disastertype_code: TARGET_DISASTER_TYPE_CODES.join(","),
    });
    await sleep(REQUEST_INTERVAL_MS);

    for (const feature of features) {
      const props = feature.properties as DisasterHistoryFeatureProps;
      const occurredOn = parseDisasterDate(props.disaster_date);
      if (!props.disastertype_code || !props.disaster_name_ja || !occurredOn) continue;
      records.push({
        disasterTypeCode: props.disastertype_code,
        disasterName: props.disaster_name_ja,
        occurredOn,
        source: props.disaster_source ?? null,
        geometry: (feature.geometry as DisasterGeometry) ?? null,
      });
    }
  }

  return records;
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
  let totalSaved = 0;
  for (const m of municipalities) {
    const records = await fetchDisasterRecords(m.longitude!, m.latitude!, apiKey);

    for (const record of records) {
      await prisma.disasterHistory.upsert({
        where: {
          municipalityCode_disasterTypeCode_occurredOn: {
            municipalityCode: m.code,
            disasterTypeCode: record.disasterTypeCode,
            occurredOn: record.occurredOn,
          },
        },
        create: {
          municipalityCode: m.code,
          ...record,
          geometry: (record.geometry as Prisma.InputJsonValue | undefined) ?? undefined,
        },
        update: {
          disasterName: record.disasterName,
          source: record.source,
          geometry: (record.geometry as Prisma.InputJsonValue | undefined) ?? undefined,
        },
      });
    }

    processed++;
    totalSaved += records.length;
    console.log(`[${processed}/${municipalities.length}] ${m.name}: ${records.length}件`);
  }

  console.log(`完了（延べ${totalSaved}件処理、重複はupsertで統合済み）`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
