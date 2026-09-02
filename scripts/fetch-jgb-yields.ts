// 財務省「国債金利情報」CSVを取得し、10年債利回りをJgbYieldテーブルへ洗い替えするバッチスクリプト。
// 実行例: npm run fetch:jgb-yields
//
// CSVはShift-JISエンコード・和暦日付（例: R8.9.1 = 令和8年9月1日）。
// 直近5年分のみ取り込む（不動産取引データの比較対象期間に対して十分な範囲のため）。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const JGB_CSV_URL = "https://www.mof.go.jp/jgbs/reference/interest_rate/data/jgbcm_all.csv";
const TEN_YEAR_COLUMN_INDEX = 10; // 列: 基準日,1年,2年,...,9年,10年,15年,...
const YEARS_TO_KEEP = 5;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ERA_BASE_YEAR: Record<string, number> = { S: 1925, H: 1988, R: 2018 };

function parseWarekiDate(wareki: string): Date | null {
  const match = wareki.match(/^([SHR])(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  const [, era, yearStr, monthStr, dayStr] = match;
  const eraBase = ERA_BASE_YEAR[era];
  if (eraBase === undefined) return null;
  const westernYear = eraBase + Number(yearStr);
  return new Date(Date.UTC(westernYear, Number(monthStr) - 1, Number(dayStr)));
}

async function main() {
  const res = await fetch(JGB_CSV_URL);
  if (!res.ok) throw new Error(`国債金利情報CSVの取得に失敗しました: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = new TextDecoder("shift_jis").decode(buf);

  const dataLines = text.split("\n").slice(2); // 1行目タイトル、2行目ヘッダーを除く
  const cutoffDate = new Date();
  cutoffDate.setUTCFullYear(cutoffDate.getUTCFullYear() - YEARS_TO_KEEP);

  const records: { date: Date; tenYearRate: number }[] = [];
  for (const line of dataLines) {
    const cols = line.split(",");
    if (cols.length <= TEN_YEAR_COLUMN_INDEX) continue;

    const date = parseWarekiDate(cols[0].trim());
    if (!date || date < cutoffDate) continue;

    const tenYearStr = cols[TEN_YEAR_COLUMN_INDEX].trim();
    const tenYearRate = Number(tenYearStr);
    if (tenYearStr === "-" || tenYearStr === "" || Number.isNaN(tenYearRate)) continue;

    records.push({ date, tenYearRate });
  }

  console.log(`取り込み対象: ${records.length}件（直近${YEARS_TO_KEEP}年分）`);

  for (const record of records) {
    await prisma.jgbYield.upsert({
      where: { date: record.date },
      create: { date: record.date, tenYearRate: record.tenYearRate },
      update: { tenYearRate: record.tenYearRate },
    });
  }

  console.log("完了");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
