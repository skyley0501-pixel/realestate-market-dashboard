import type { PrismaClient } from "@/generated/prisma/client";
import { Money } from "@/shared/domain/value-objects/money";
import { CondoMarketStat } from "../domain/entities/condo-market-stat";
import { CondoSupply } from "../domain/entities/condo-supply";
import type { CondoMarketRepository } from "../domain/repositories/condo-market-repository";

export class PrismaCondoMarketRepository implements CondoMarketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllCondoSupply(): Promise<CondoSupply[]> {
    const rows = await this.prisma.condoSupplyStat.findMany({
      include: { prefecture: { select: { name: true } } },
      orderBy: { fiscalYear: "asc" },
    });
    return rows.map((row) =>
      CondoSupply.create({
        prefectureCode: row.prefectureCode,
        prefectureName: row.prefecture.name,
        fiscalYear: row.fiscalYear,
        unitsStarted: row.unitsStarted,
      }),
    );
  }

  async findAllCondoMarketStats(): Promise<CondoMarketStat[]> {
    const rows = await this.prisma.condoMarketStat.findMany({
      include: { prefecture: { select: { name: true } } },
      orderBy: { period: "asc" },
    });
    return rows.map((row) =>
      CondoMarketStat.create({
        prefectureCode: row.prefectureCode,
        prefectureName: row.prefecture.name,
        period: row.period,
        medianPrice: Money.fromYen(row.medianPriceYen),
        averagePrice: Money.fromYen(row.averagePriceYen),
        sampleSize: row.sampleSize,
        transactionCount: row.transactionCount,
      }),
    );
  }
}
