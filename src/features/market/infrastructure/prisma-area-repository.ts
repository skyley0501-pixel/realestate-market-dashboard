import type { PrismaClient } from "@/generated/prisma/client";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../domain/aggregates/area-market-snapshot";
import { Area } from "../domain/entities/area";
import type { AreaRepository } from "../domain/repositories/area-repository";
import { PriceStatistics } from "../domain/value-objects/price-statistics";
import { TrendRate } from "../domain/value-objects/trend-rate";

type AreaStatisticsRow = Awaited<
  ReturnType<PrismaClient["areaStatistics"]["findFirstOrThrow"]>
> & {
  municipality: { code: string; name: string; prefectureCode: string; prefecture: { name: string } };
};

function toSnapshot(row: AreaStatisticsRow): AreaMarketSnapshot {
  const area = Area.create({
    code: row.municipality.code,
    name: row.municipality.name,
    prefectureCode: row.municipality.prefectureCode,
    prefectureName: row.municipality.prefecture.name,
  });
  const statistics = PriceStatistics.reconstruct(
    Money.fromYen(row.medianPriceYen),
    Money.fromYen(row.averagePriceYen),
    Money.fromYen(row.q1PriceYen),
    Money.fromYen(row.q3PriceYen),
    row.sampleSize,
  );
  const trendRate = row.yoyChangeRatePercent !== null ? TrendRate.reconstruct(row.yoyChangeRatePercent) : null;

  return AreaMarketSnapshot.create({ area, period: row.period, statistics, trendRate });
}

export class PrismaAreaRepository implements AreaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLatestSnapshots(): Promise<AreaMarketSnapshot[]> {
    const latest = await this.prisma.areaStatistics.aggregate({ _max: { period: true } });
    const latestPeriod = latest._max.period;
    if (!latestPeriod) return [];

    const rows = await this.prisma.areaStatistics.findMany({
      where: { period: latestPeriod },
      include: { municipality: { include: { prefecture: true } } },
      orderBy: { medianPriceYen: "desc" },
    });
    return rows.map(toSnapshot);
  }

  async findLatestSnapshotByCode(code: string): Promise<AreaMarketSnapshot | null> {
    const row = await this.prisma.areaStatistics.findFirst({
      where: { municipalityCode: code },
      orderBy: { period: "desc" },
      include: { municipality: { include: { prefecture: true } } },
    });
    return row ? toSnapshot(row) : null;
  }
}
