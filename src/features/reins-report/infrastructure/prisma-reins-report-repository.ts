import type { PrismaClient } from "@/generated/prisma/client";
import { ReinsMarketStat, type ReinsPropertyType, type ReinsRegion } from "../domain/entities/reins-market-stat";
import type { ReinsReportRepository } from "../domain/repositories/reins-report-repository";

function toEntity(row: {
  period: string;
  region: string;
  propertyType: string;
  contractCount: number;
  contractUnitPriceManYen: number | null;
  contractPriceManYen: number | null;
  newListingUnitPriceManYen: number | null;
  inventoryCount: number | null;
}): ReinsMarketStat {
  return ReinsMarketStat.create({
    period: row.period,
    region: row.region as ReinsRegion,
    propertyType: row.propertyType as ReinsPropertyType,
    contractCount: row.contractCount,
    contractUnitPriceManYen: row.contractUnitPriceManYen,
    contractPriceManYen: row.contractPriceManYen,
    newListingUnitPriceManYen: row.newListingUnitPriceManYen,
    inventoryCount: row.inventoryCount,
  });
}

export class PrismaReinsReportRepository implements ReinsReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findHistory(region: ReinsRegion, propertyType: ReinsPropertyType): Promise<ReinsMarketStat[]> {
    const rows = await this.prisma.reinsMarketStat.findMany({
      where: { region, propertyType },
      orderBy: { period: "asc" },
    });
    return rows.map(toEntity);
  }
}
