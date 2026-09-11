// 東日本レインズ「月例速報マーケットウオッチ」の月次統計をReinsMarketStatテーブルへ投入するスクリプト。
// 実行例: npm run seed:reins-market-stats
//
// データはPDF公開のみでAPIが無いため、月次PDFがdata/reins/にinbox投入されるたびに
// このファイルのRECORDS配列へ1ヶ月分を追記し、再実行する運用（upsertのため重複投入しても安全）。
// 出典: 公益財団法人東日本不動産流通機構「月例速報マーケットウオッチ」
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

type Region = "首都圏" | "東京都区部" | "東京都" | "神奈川県" | "千葉県" | "埼玉県";
type PropertyType = "マンション" | "戸建";

interface StatRecord {
  period: string; // "YYYY-MM"
  region: Region;
  propertyType: PropertyType;
  contractCount: number;
  contractUnitPriceManYen: number | null;
  contractPriceManYen: number | null;
  newListingUnitPriceManYen: number | null;
  inventoryCount: number | null;
}

// 首都圏中古マンション: 成約件数・成約㎡単価・成約価格・新規登録㎡単価・在庫件数
// 出典: MW_202608data.pdf p2-4「Ⅰ.中古マンションレポート 首都圏・都県別概況」
const METRO_CONDO: [string, number, number, number, number, number][] = [
  ["2025-08", 3553, 84.85, 5279, 96.15, 44578],
  ["2025-09", 4475, 85.18, 5352, 101.37, 43850],
  ["2025-10", 4222, 85.35, 5325, 102.33, 43669],
  ["2025-11", 4435, 82.22, 5204, 104.10, 43156],
  ["2025-12", 3975, 85.08, 5340, 108.57, 43381],
  ["2026-01", 3343, 86.99, 5493, 110.97, 44776],
  ["2026-02", 4241, 85.61, 5458, 108.83, 45112],
  ["2026-03", 5001, 86.34, 5521, 111.40, 44728],
  ["2026-04", 3903, 85.93, 5321, 114.01, 45215],
  ["2026-05", 3709, 80.78, 5067, 112.67, 45804],
  ["2026-06", 4241, 82.64, 5208, 115.57, 45995],
  ["2026-07", 3638, 84.17, 5267, 117.86, 47151],
  ["2026-08", 3180, 81.60, 5129, 116.81, 48235],
];

// 首都圏中古戸建住宅: 成約件数・成約価格・在庫件数（㎡単価・新規登録単価データなし）
// 出典: MW_202608data.pdf p20「Ⅱ.中古戸建住宅レポート 首都圏・都県別概況」
const METRO_DETACHED: [string, number, number, number][] = [
  ["2025-08", 1611, 3894, 23567],
  ["2025-09", 1986, 3906, 23538],
  ["2025-10", 1804, 3801, 23559],
  ["2025-11", 1932, 4002, 23523],
  ["2025-12", 1859, 4056, 23211],
  ["2026-01", 1496, 4056, 23539],
  ["2026-02", 1910, 4115, 23685],
  ["2026-03", 2169, 4101, 23301],
  ["2026-04", 1839, 4177, 23231],
  ["2026-05", 1835, 4215, 23087],
  ["2026-06", 2019, 4006, 22893],
  ["2026-07", 1738, 3933, 23197],
  ["2026-08", 1641, 3960, 23277],
];

// 東京都区部・東京都・神奈川県・千葉県・埼玉県 中古マンション: 成約件数・成約㎡単価のみ
// 出典: MW_202608_summary.pdf p4-5「首都圏エリア別 中古マンション市場の成約動向データ」
const AREA_CONDO: Record<Exclude<Region, "首都圏">, [string, number, number][]> = {
  東京都区部: [
    ["2025-08", 1593, 133.10],
    ["2025-09", 1995, 131.54],
    ["2025-10", 1836, 135.03],
    ["2025-11", 1853, 130.96],
    ["2025-12", 1695, 135.61],
    ["2026-01", 1433, 137.50],
    ["2026-02", 1817, 133.37],
    ["2026-03", 2145, 136.10],
    ["2026-04", 1635, 137.46],
    ["2026-05", 1452, 131.24],
    ["2026-06", 1716, 131.15],
    ["2026-07", 1509, 135.77],
    ["2026-08", 1265, 132.69],
  ],
  東京都: [
    ["2025-08", 1921, 119.75],
    ["2025-09", 2431, 118.46],
    ["2025-10", 2234, 121.06],
    ["2025-11", 2230, 118.54],
    ["2025-12", 2096, 120.12],
    ["2026-01", 1752, 123.05],
    ["2026-02", 2227, 119.77],
    ["2026-03", 2583, 123.13],
    ["2026-04", 2008, 122.68],
    ["2026-05", 1819, 116.44],
    ["2026-06", 2136, 116.91],
    ["2026-07", 1863, 121.08],
    ["2026-08", 1562, 118.85],
  ],
  神奈川県: [
    ["2025-08", 844, 58.90],
    ["2025-09", 1076, 58.80],
    ["2025-10", 1043, 59.37],
    ["2025-11", 1114, 59.11],
    ["2025-12", 960, 60.40],
    ["2026-01", 839, 62.07],
    ["2026-02", 980, 60.82],
    ["2026-03", 1275, 60.96],
    ["2026-04", 949, 63.71],
    ["2026-05", 972, 59.92],
    ["2026-06", 1073, 60.35],
    ["2026-07", 911, 58.96],
    ["2026-08", 808, 60.08],
  ],
  千葉県: [
    ["2025-08", 397, 39.64],
    ["2025-09", 479, 40.28],
    ["2025-10", 491, 40.75],
    ["2025-11", 537, 41.37],
    ["2025-12", 435, 40.40],
    ["2026-01", 355, 38.60],
    ["2026-02", 485, 43.66],
    ["2026-03", 566, 41.27],
    ["2026-04", 468, 40.44],
    ["2026-05", 445, 40.19],
    ["2026-06", 508, 44.05],
    ["2026-07", 415, 41.37],
    ["2026-08", 398, 41.68],
  ],
  埼玉県: [
    ["2025-08", 391, 43.50],
    ["2025-09", 489, 44.77],
    ["2025-10", 454, 42.91],
    ["2025-11", 554, 44.16],
    ["2025-12", 484, 43.43],
    ["2026-01", 397, 46.76],
    ["2026-02", 549, 45.88],
    ["2026-03", 577, 45.32],
    ["2026-04", 478, 44.06],
    ["2026-05", 473, 46.17],
    ["2026-06", 524, 45.97],
    ["2026-07", 449, 44.53],
    ["2026-08", 412, 44.35],
  ],
};

function buildRecords(): StatRecord[] {
  const records: StatRecord[] = [];

  for (const [period, contractCount, contractUnitPriceManYen, contractPriceManYen, newListingUnitPriceManYen, inventoryCount] of METRO_CONDO) {
    records.push({
      period,
      region: "首都圏",
      propertyType: "マンション",
      contractCount,
      contractUnitPriceManYen,
      contractPriceManYen,
      newListingUnitPriceManYen,
      inventoryCount,
    });
  }

  for (const [period, contractCount, contractPriceManYen, inventoryCount] of METRO_DETACHED) {
    records.push({
      period,
      region: "首都圏",
      propertyType: "戸建",
      contractCount,
      contractUnitPriceManYen: null,
      contractPriceManYen,
      newListingUnitPriceManYen: null,
      inventoryCount,
    });
  }

  for (const [region, rows] of Object.entries(AREA_CONDO) as [Exclude<Region, "首都圏">, [string, number, number][]][]) {
    for (const [period, contractCount, contractUnitPriceManYen] of rows) {
      records.push({
        period,
        region,
        propertyType: "マンション",
        contractCount,
        contractUnitPriceManYen,
        contractPriceManYen: null,
        newListingUnitPriceManYen: null,
        inventoryCount: null,
      });
    }
  }

  return records;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const records = buildRecords();
  let upserted = 0;
  for (const record of records) {
    await prisma.reinsMarketStat.upsert({
      where: {
        period_region_propertyType: {
          period: record.period,
          region: record.region,
          propertyType: record.propertyType,
        },
      },
      create: record,
      update: {
        contractCount: record.contractCount,
        contractUnitPriceManYen: record.contractUnitPriceManYen,
        contractPriceManYen: record.contractPriceManYen,
        newListingUnitPriceManYen: record.newListingUnitPriceManYen,
        inventoryCount: record.inventoryCount,
      },
    });
    upserted++;
  }

  console.log(`${upserted}件のReinsMarketStatを投入しました。`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
