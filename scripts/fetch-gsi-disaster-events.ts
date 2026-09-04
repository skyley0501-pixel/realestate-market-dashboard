// 国土地理院が個別の大規模災害ごとに公開する浸水推定図（ZIP同梱のGeoJSON）を取得し、
// DisasterHistoryテーブルへ保存するバッチスクリプト。
// 実行例: npm run fetch:gsi-disaster-events
//
// XST001（国土調査「土地履歴調査」）は調査時点（2010年代半ば頃）までの過去文献アーカイブのため、
// 令和以降の災害は収録されていない。国土地理院は大規模災害が起きるたびに個別ページで
// 浸水推定図等を公開しているが、体系だったAPIではなく都度手動でURLを追加する必要がある
// （DISASTER_EVENTSに1件ずつ追記していく運用）。
//
// GeoJSONの各ポリゴンには市区町村名・災害名の属性が無いため、代表点が
// public/geo/kanto-municipalities.geojsonのどの区域に含まれるかで判定し、
// 同じ市区町村内のポリゴンはMultiPolygonにまとめて1レコードとして保存する
// （DisasterHistoryの一意キーはmunicipalityCode×disasterTypeCode×occurredOnのため）。
import "dotenv/config";
import { constants as cryptoConstants } from "node:crypto";
import { readFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import AdmZip from "adm-zip";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.ts";
import { centroidOf, isPointInGeometry } from "../src/shared/domain/geo/geometry-utils.ts";

// www1.gsi.go.jpはTLSのレガシー再ネゴシエーションを要求するため、Node.js標準fetch（内部undici）の
// 既定設定ではERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLEDで拒否される。node:httpsのsecureOptionsで
// レガシー再ネゴシエーションを明示的に許可してダウンロードする
function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { secureOptions: cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`ZIP取得に失敗しました: HTTP ${res.statusCode} (${url})`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

const GEOJSON_PATH = path.join(process.cwd(), "public", "geo", "kanto-municipalities.geojson");

// 1都3県（東京・神奈川・千葉・埼玉）がおおむね収まる範囲。ZIP内から対象ファイルを絞り込むのに使う
const KANTO_BOUNDS = { minLon: 138.8, maxLon: 140.9, minLat: 34.9, maxLat: 36.3 };

interface DisasterEventSource {
  name: string;
  occurredOn: string; // "YYYY-MM-DD"
  zipUrl: string;
  disasterTypeCode: string; // 既存分類コードに合わせる（11:浸水域等）
  disasterName: string;
  source: string;
}

// 追加する災害はここに1件ずつ足していく運用
const DISASTER_EVENTS: DisasterEventSource[] = [
  {
    name: "令和元年東日本台風",
    occurredOn: "2019-10-12",
    zipUrl: "https://www1.gsi.go.jp/geowww/201910/shinsui/shinsui_rinkaku.zip",
    disasterTypeCode: "11",
    disasterName: "浸水域等",
    source: "国土地理院 浸水推定図（令和元年台風第19号）",
  },
];

interface MunicipalityFeature {
  properties: Record<string, unknown>;
  geometry: GeoJSON.Geometry;
}

async function loadMunicipalityGeometries(): Promise<Map<string, GeoJSON.Geometry>> {
  const raw = await readFile(GEOJSON_PATH, "utf-8");
  const geo = JSON.parse(raw) as { features: MunicipalityFeature[] };
  const map = new Map<string, GeoJSON.Geometry>();
  for (const feature of geo.features) {
    const code = feature.properties.N03_007;
    if (typeof code === "string" && code !== "") {
      map.set(code, feature.geometry);
    }
  }
  return map;
}

function boundingBoxOf(geometry: GeoJSON.Geometry): { minLon: number; maxLon: number; minLat: number; maxLat: number } | null {
  const positions: [number, number][] = [];
  const collect = (coords: unknown): void => {
    if (Array.isArray(coords) && typeof coords[0] === "number") {
      positions.push(coords as [number, number]);
      return;
    }
    if (Array.isArray(coords)) {
      for (const c of coords) collect(c);
    }
  };
  collect((geometry as { coordinates: unknown }).coordinates);
  if (positions.length === 0) return null;

  const lons = positions.map((p) => p[0]);
  const lats = positions.map((p) => p[1]);
  return { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
}

function overlapsKanto(bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number }): boolean {
  return (
    bbox.minLon <= KANTO_BOUNDS.maxLon &&
    bbox.maxLon >= KANTO_BOUNDS.minLon &&
    bbox.minLat <= KANTO_BOUNDS.maxLat &&
    bbox.maxLat >= KANTO_BOUNDS.minLat
  );
}

// ZIPをダウンロードし、関東エリアに重なるバウンディングボックスを持つGeoJSONエントリだけを返す。
// ZIP内のファイル名はShift-JISのため文字化けするので、名前ではなく内容の座標範囲で対象を判定する
async function extractKantoGeoJsonFeatures(zipUrl: string): Promise<GeoJSON.Feature[]> {
  const buffer = await downloadBuffer(zipUrl);

  const zip = new AdmZip(buffer);
  const features: GeoJSON.Feature[] = [];
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !entry.entryName.toLowerCase().endsWith(".geojson")) continue;
    const obj = JSON.parse(entry.getData().toString("utf-8")) as GeoJSON.FeatureCollection;
    for (const feature of obj.features) {
      const bbox = boundingBoxOf(feature.geometry);
      if (bbox && overlapsKanto(bbox)) {
        features.push(feature);
      }
    }
  }
  return features;
}

async function main() {
  const allMunicipalityGeometries = await loadMunicipalityGeometries();

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // kanto-municipalities.geojsonはREMDAの対象外エリア（一部離島等）も含むため、
  // DBのMunicipalityマスタに実在するコードだけに絞り込む（外部キー制約違反を防ぐ）
  const registeredCodes = new Set((await prisma.municipality.findMany({ select: { code: true } })).map((m) => m.code));
  const municipalityGeometries = new Map(
    [...allMunicipalityGeometries].filter(([code]) => registeredCodes.has(code)),
  );

  for (const event of DISASTER_EVENTS) {
    console.log(`取得中: ${event.name}（${event.occurredOn}）`);
    const features = await extractKantoGeoJsonFeatures(event.zipUrl);
    console.log(`  -> 関東エリアのポリゴン: ${features.length}件`);

    // 市区町村コードごとにポリゴンをグループ化する
    const byMunicipality = new Map<string, GeoJSON.Polygon[]>();
    for (const feature of features) {
      const point = centroidOf(feature.geometry);
      if (!point) continue;
      for (const [code, geometry] of municipalityGeometries) {
        if (isPointInGeometry(point, geometry)) {
          const list = byMunicipality.get(code) ?? [];
          list.push(feature.geometry as GeoJSON.Polygon);
          byMunicipality.set(code, list);
          break;
        }
      }
    }

    const occurredOn = new Date(`${event.occurredOn}T00:00:00.000Z`);
    for (const [municipalityCode, polygons] of byMunicipality) {
      const geometry: GeoJSON.MultiPolygon = {
        type: "MultiPolygon",
        coordinates: polygons.map((p) => p.coordinates),
      };
      await prisma.disasterHistory.upsert({
        where: {
          municipalityCode_disasterTypeCode_occurredOn: {
            municipalityCode,
            disasterTypeCode: event.disasterTypeCode,
            occurredOn,
          },
        },
        create: {
          municipalityCode,
          disasterTypeCode: event.disasterTypeCode,
          disasterName: event.disasterName,
          occurredOn,
          source: event.source,
          geometry: geometry as unknown as Prisma.InputJsonValue,
        },
        update: {
          disasterName: event.disasterName,
          source: event.source,
          geometry: geometry as unknown as Prisma.InputJsonValue,
        },
      });
    }

    console.log(`  -> ${byMunicipality.size}市区町村（延べポリゴン${features.length}件）を保存`);
  }

  console.log("完了");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
