// Transactionを市区町村×期間で集計し、AreaStatisticsテーブルへ洗い替えするバッチスクリプト。
// 実行例: npm run db:aggregate
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { Area } from "../src/features/market/domain/entities/area.ts";
import { MarketStatisticsCalculator } from "../src/features/market/domain/services/market-statistics-calculator.ts";
import type { PriceStatistics } from "../src/features/market/domain/value-objects/price-statistics.ts";
import { BuildingAge } from "../src/features/transaction/domain/value-objects/building-age.ts";
import { Transaction } from "../src/features/transaction/domain/entities/transaction.ts";
import { Money } from "../src/shared/domain/value-objects/money.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const calculator = new MarketStatisticsCalculator();

// 5年累計の取引件数がこの値以下の市区町村は、サンプルが少なく中央値の代表性が低いため
// 集計・ランキング表示の対象から除外する（生のTransactionデータ自体は削除せず、取引検索では引き続き利用できる）。
const MIN_TOTAL_TRANSACTIONS = 1000;

// "2025Q3" -> "2025Q2"、"2025Q1" -> "2024Q4" のように直前の四半期キーを求める
export function previousPeriod(period: string): string {
  const match = period.match(/^(\d{4})Q([1-4])$/);
  if (!match) throw new Error(`不正な期間形式です: ${period}`);
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  return quarter === 1 ? `${year - 1}Q4` : `${year}Q${quarter - 1}`;
}

async function main() {
  const rows = await prisma.transaction.findMany({
    select: {
      municipalityCode: true,
      transactionPeriod: true,
      priceYen: true,
      areaSqm: true,
      propertyType: true,
      buildingYear: true,
    },
  });
  const municipalities = await prisma.municipality.findMany({ include: { prefecture: true } });
  const municipalityByCode = new Map(municipalities.map((m) => [m.code, m]));
  const currentYear = new Date().getFullYear();

  // municipalityCode -> period -> Transaction[]
  const grouped = new Map<string, Map<string, Transaction[]>>();
  for (const row of rows) {
    // 新築未完成物件は「建築年」欄に竣工予定年が入り現在年を超えることがある。
    // この集計では築年自体は使わないため、BuildingAgeの不変条件に合わせて築年不明として扱う。
    const buildingYear = row.buildingYear !== null && row.buildingYear <= currentYear ? row.buildingYear : null;
    const transaction = Transaction.create({
      id: crypto.randomUUID(),
      municipalityCode: row.municipalityCode,
      stationId: null,
      transactionPeriod: row.transactionPeriod,
      propertyType: row.propertyType,
      price: Money.fromYen(row.priceYen),
      areaSqm: row.areaSqm,
      floorPlan: null,
      buildingAge: BuildingAge.fromBuildingYear(buildingYear),
      structure: null,
      use: null,
      remarks: null,
    });

    const byPeriod = grouped.get(row.municipalityCode) ?? new Map<string, Transaction[]>();
    const transactions = byPeriod.get(row.transactionPeriod) ?? [];
    transactions.push(transaction);
    byPeriod.set(row.transactionPeriod, transactions);
    grouped.set(row.municipalityCode, byPeriod);
  }

  const excludedCodes: string[] = [];

  let upserted = 0;
  for (const [municipalityCode, byPeriod] of grouped) {
    const municipality = municipalityByCode.get(municipalityCode);
    if (!municipality) continue;

    const totalTransactionCount = [...byPeriod.values()].reduce((sum, txns) => sum + txns.length, 0);
    if (totalTransactionCount <= MIN_TOTAL_TRANSACTIONS) {
      excludedCodes.push(municipalityCode);
      continue;
    }

    const area = Area.create({
      code: municipality.code,
      name: municipality.name,
      prefectureCode: municipality.prefectureCode,
      prefectureName: municipality.prefecture.name,
    });

    // 期間昇順で処理し、直前の期間の統計を前期比の算出に使えるようにする
    const statisticsByPeriod = new Map<string, PriceStatistics>();
    const periods = [...byPeriod.keys()].sort();

    for (const period of periods) {
      const transactions = byPeriod.get(period)!;
      const previousStatistics = statisticsByPeriod.get(previousPeriod(period)) ?? null;
      const snapshot = calculator.calculateSnapshot(area, transactions, period, previousStatistics);
      statisticsByPeriod.set(period, snapshot.statistics);

      const data = {
        medianPriceYen: snapshot.statistics.median.yen,
        averagePriceYen: snapshot.statistics.average.yen,
        q1PriceYen: snapshot.statistics.q1.yen,
        q3PriceYen: snapshot.statistics.q3.yen,
        avgUnitPriceYenPerSqm: snapshot.avgUnitPriceYenPerSqm,
        sampleSize: snapshot.statistics.sampleSize,
        transactionCount: snapshot.transactionCount,
        yoyChangeRatePercent: snapshot.trendRate?.percent ?? null,
      };

      await prisma.areaStatistics.upsert({
        where: { municipalityCode_period: { municipalityCode, period } },
        create: { municipalityCode, period, ...data },
        update: data,
      });
      upserted += 1;
    }
  }

  if (excludedCodes.length > 0) {
    const { count } = await prisma.areaStatistics.deleteMany({
      where: { municipalityCode: { in: excludedCodes } },
    });
    console.log(
      `5年累計${MIN_TOTAL_TRANSACTIONS}件以下のため${excludedCodes.length}市区町村を除外しました（既存のAreaStatistics ${count}件を削除）。`,
    );
  }
  console.log(`${upserted}件のAreaStatisticsを集計しました。`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
