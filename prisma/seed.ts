// scripts/fetch-reinfolib.ts が data/reinfolib/*.json に保存した生データをクレンジングし、
// Prefecture/Municipality をupsertした上でTransactionへ投入するシードスクリプト。
// 実行: npx prisma db seed
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import type { ReinfolibTransactionRecord } from "../scripts/fetch-reinfolib.ts";
import { transformRecords } from "./lib/reinfolib-transform.ts";

const DATA_DIR = path.join(process.cwd(), "data", "reinfolib");

async function loadRecords(): Promise<ReinfolibTransactionRecord[]> {
  let files: string[];
  try {
    files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
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
  const rawRecords = await loadRecords();
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

    const result = await prisma.transaction.createMany({ data: transactions });
    console.log(`Transactionを${result.count}件投入しました。`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
