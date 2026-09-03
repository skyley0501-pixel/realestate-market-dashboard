import type { PrismaClient } from "@/generated/prisma/client";
import { DisasterHistory } from "../domain/entities/disaster-history";
import { HazardZone } from "../domain/entities/hazard-zone";
import type { HazardRepository } from "../domain/repositories/hazard-repository";

export class PrismaHazardRepository implements HazardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findHazardZoneByMunicipality(municipalityCode: string): Promise<HazardZone | null> {
    const row = await this.prisma.hazardZone.findUnique({ where: { municipalityCode } });
    return row
      ? HazardZone.create({ floodZone: row.floodZone, landslideZone: row.landslideZone, checkedAt: row.checkedAt })
      : null;
  }

  async findDisasterHistoryByMunicipality(municipalityCode: string, limit: number): Promise<DisasterHistory[]> {
    const rows = await this.prisma.disasterHistory.findMany({
      where: { municipalityCode },
      orderBy: { occurredOn: "desc" },
      take: limit,
    });
    return rows.map((row) =>
      DisasterHistory.create({
        disasterTypeCode: row.disasterTypeCode,
        disasterName: row.disasterName,
        occurredOn: row.occurredOn,
        source: row.source,
      }),
    );
  }
}
