// scripts/fetch-reinfolib.ts が data/reinfolib/*.json に保存した生データをクレンジングし、
// Prefecture/Municipality をupsertした上でTransactionへ投入するシードスクリプト。
// 実行: npx prisma db seed
// 差分投入: npx prisma db seed -- --period 2026Q2
//   指定期間のファイル(*_2026Q2.json)だけを読み、DB上の同期間のTransactionを削除してから投入し直す（冪等）。
//   --period 未指定の場合は全ファイルをそのまま追加投入する（空DBへの初期投入用。既存データがあると重複する）。
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import type { ReinfolibTransactionRecord } from "../scripts/fetch-reinfolib.ts";
import { transformRecords } from "./lib/reinfolib-transform.ts";

const DATA_DIR = path.join(process.cwd(), "data", "reinfolib");

function parsePeriodArg(argv: string[]): string | null {
  const index = argv.indexOf("--period");
  return index >= 0 ? (argv[index + 1] ?? null) : null;
}

async function loadRecords(period: string | null): Promise<ReinfolibTransactionRecord[]> {
  let files: string[];
  try {
    files = (await readdir(DATA_DIR)).filter(
      (f) => f.endsWith(".json") && (period === null || f.endsWith(`_${period}.json`)),
    );
  } catch {
    return [];
  }

  const records: ReinfolibTransactionRecord[] = [];
  for (const file of files) {
    const content = await readFile(path.join(DATA_DIR, file), "utf-8");
    records.push(...(JSON.parse(content) as ReinfolibTransactionRecord[]));
  }
  return records;
}

async function main() {
  const period = parsePeriodArg(process.argv.slice(2));
  const rawRecords = await loadRecords(period);
  if (rawRecords.length === 0) {
    console.log(
      `${DATA_DIR} にJSONファイルが見つかりません。先に "npm run fetch:reinfolib" で取得してください（REINFOLIB_API_KEYが必要）。`,
    );
    return;
  }

  const { transactions, municipalities, skipped } = transformRecords(rawRecords);
  console.log(
    `取得件数: ${rawRecords.length} / 有効: ${transactions.length} / スキップ: ${skipped}`,
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const prefectures = new Map(
      [...municipalities.values()].map((m) => [m.prefectureCode, m.prefectureName]),
    );
    for (const [code, name] of prefectures) {
      await prisma.prefecture.upsert({
        where: { code },
        create: { code, name },
        update: { name },
      });
    }

    for (const m of municipalities.values()) {
      await prisma.municipality.upsert({
        where: { code: m.code },
        create: { code: m.code, name: m.name, prefectureCode: m.prefectureCode },
        update: { name: m.name, prefectureCode: m.prefectureCode },
      });
    }

    if (period !== null) {
      const deleted = await prisma.transaction.deleteMany({ where: { transactionPeriod: period } });
      console.log(`既存の${period}のTransactionを${deleted.count}件削除しました。`);
    }

    const BATCH_SIZE = 5000;
    let inserted = 0;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      const result = await prisma.transaction.createMany({ data: batch });
      inserted += result.count;
      console.log(`  投入済み: ${inserted}/${transactions.length}件`);
    }
    console.log(`Transactionを${inserted}件投入しました。`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
