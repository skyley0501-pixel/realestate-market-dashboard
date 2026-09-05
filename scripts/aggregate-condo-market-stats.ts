// Transaction（中古マンション等のみ）を都道府県×期間で集計し、CondoMarketStatテーブルへ
// 洗い替えするバッチスクリプト。REMDA自身の実取引データが元なので著作権の制約が無い。
// 実行例: npm run aggregate:condo-market
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PriceStatistics } from "../src/features/market/domain/value-objects/price-statistics.ts";
import { Money } from "../src/shared/domain/value-objects/money.ts";

const CONDO_PROPERTY_TYPE = "中古マンション等";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const rows = await prisma.transaction.findMany({
    where: { propertyType: CONDO_PROPERTY_TYPE },
    select: { municipalityCode: true, transactionPeriod: true, priceYen: true },
  });

  // prefectureCode -> period -> price[]
  const grouped = new Map<string, Map<string, bigint[]>>();
  for (const row of rows) {
    const prefectureCode = row.municipalityCode.slice(0, 2);
    const byPeriod = grouped.get(prefectureCode) ?? new Map<string, bigint[]>();
    const prices = byPeriod.get(row.transactionPeriod) ?? [];
    prices.push(row.priceYen);
    byPeriod.set(row.transactionPeriod, prices);
    grouped.set(prefectureCode, byPeriod);
  }

  let saved = 0;
  for (const [prefectureCode, byPeriod] of grouped) {
    for (const [period, prices] of byPeriod) {
      const statistics = PriceStatistics.calculate(prices.map((yen) => Money.fromYen(yen)));

      await prisma.condoMarketStat.upsert({
        where: { prefectureCode_period: { prefectureCode, period } },
        create: {
          prefectureCode,
          period,
          medianPriceYen: statistics.median.yen,
          averagePriceYen: statistics.average.yen,
          sampleSize: statistics.sampleSize,
          transactionCount: prices.length,
        },
        update: {
          medianPriceYen: statistics.median.yen,
          averagePriceYen: statistics.average.yen,
          sampleSize: statistics.sampleSize,
          transactionCount: prices.length,
        },
      });
      saved++;
    }
  }

  console.log(`完了: ${saved}件のCondoMarketStatを集計しました。`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
