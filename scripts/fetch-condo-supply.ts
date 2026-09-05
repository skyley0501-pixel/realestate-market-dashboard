// 国土交通省「建築着工統計調査」（e-Stat経由）から、1都3県の新築分譲マンション着工戸数を取得し、
// CondoSupplyStatテーブルへ保存するバッチスクリプト。
// 実行例: npm run fetch:condo-supply
//
// 統計表「利用関係別 構造別 建て方別 都道府県別 戸数」(statsDataId=0003119736)を
// 「建て方=共同住宅」×「構造=計」×「利用関係=分譲住宅」で絞り込む。年度確定値のため年1回更新される。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const ESTAT_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const STATS_DATA_ID = "0003119736";

// 東京都・神奈川県・千葉県・埼玉県（e-Statの地域コードは5桁、先頭2桁がJIS X0401都道府県コードと一致）
const TARGET_AREA_CODES = ["13000", "14000", "12000", "11000"];

interface EstatValue {
  "@area": string;
  "@time": string;
  "$": string;
}

interface EstatResponse {
  GET_STATS_DATA: {
    RESULT: { STATUS: number; ERROR_MSG: string };
    STATISTICAL_DATA?: {
      DATA_INF?: { VALUE?: EstatValue | EstatValue[] };
    };
  };
}

async function fetchCondoSupply(apiKey: string): Promise<EstatValue[]> {
  const url = new URL(ESTAT_BASE_URL);
  url.searchParams.set("appId", apiKey);
  url.searchParams.set("statsDataId", STATS_DATA_ID);
  url.searchParams.set("cdTab", "19"); // 戸数
  url.searchParams.set("cdCat01", "14"); // 建て方: 共同住宅
  url.searchParams.set("cdCat02", "11"); // 構造: 計
  url.searchParams.set("cdCat03", "15"); // 利用関係: 分譲住宅
  url.searchParams.set("cdArea", TARGET_AREA_CODES.join(","));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat API error: ${res.status} ${res.statusText}`);
  const body = (await res.json()) as EstatResponse;

  const result = body.GET_STATS_DATA.RESULT;
  if (result.STATUS !== 0) throw new Error(`e-Stat APIエラー: ${result.ERROR_MSG}`);

  const values = body.GET_STATS_DATA.STATISTICAL_DATA?.DATA_INF?.VALUE;
  if (!values) return [];
  return Array.isArray(values) ? values : [values];
}

async function main() {
  const apiKey = process.env.ESTAT_API_KEY;
  if (!apiKey) {
    throw new Error("ESTAT_API_KEY が未設定です。.env に設定してください。");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const values = await fetchCondoSupply(apiKey);
  console.log(`取得件数: ${values.length}件`);

  let saved = 0;
  for (const v of values) {
    const prefectureCode = v["@area"].slice(0, 2);
    const fiscalYear = Number(v["@time"].slice(0, 4));
    const unitsStarted = Number(v["$"]);
    if (Number.isNaN(fiscalYear) || Number.isNaN(unitsStarted)) continue;

    await prisma.condoSupplyStat.upsert({
      where: { prefectureCode_fiscalYear: { prefectureCode, fiscalYear } },
      create: { prefectureCode, fiscalYear, unitsStarted },
      update: { unitsStarted },
    });
    saved++;
  }

  console.log(`完了: ${saved}件を保存しました。`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
