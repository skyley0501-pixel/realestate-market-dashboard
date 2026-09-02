// 日銀の政策金利（無担保コールレート翌日物誘導目標）の改定履歴を投入する初期シードスクリプト。
// 実行例: npm run seed:policy-rates
//
// 政策金利は金融政策決定会合の都度にしか変わらないため自動取得はせず、
// 会合で改定があった際は本ファイルに1レコード追記して再実行する運用とする（冪等・upsert）。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// レンジ表記（例: 0〜0.1%）は上限値をrate_percentとして記録する
const POLICY_RATE_HISTORY: { effectiveDate: string; ratePercent: number; note: string }[] = [
  { effectiveDate: "2024-03-19", ratePercent: 0.1, note: "マイナス金利政策解除" },
  { effectiveDate: "2024-07-31", ratePercent: 0.25, note: "2024年7月 金融政策決定会合" },
  { effectiveDate: "2025-01-24", ratePercent: 0.5, note: "2025年1月 金融政策決定会合" },
  { effectiveDate: "2025-12-19", ratePercent: 0.75, note: "2025年12月 金融政策決定会合" },
  { effectiveDate: "2026-06-16", ratePercent: 1.0, note: "2026年6月 金融政策決定会合" },
];

async function main() {
  for (const record of POLICY_RATE_HISTORY) {
    const effectiveDate = new Date(`${record.effectiveDate}T00:00:00Z`);
    await prisma.policyRate.upsert({
      where: { effectiveDate },
      create: { effectiveDate, ratePercent: record.ratePercent, note: record.note },
      update: { ratePercent: record.ratePercent, note: record.note },
    });
  }
  console.log(`政策金利を${POLICY_RATE_HISTORY.length}件投入しました。`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
