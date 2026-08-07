import type { PrismaClient } from "@/generated/prisma/client";
import type { MunicipalityOption, MunicipalityRepository } from "../domain/repositories/municipality-repository";

export class PrismaMunicipalityRepository implements MunicipalityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPrefectureCode(prefectureCode: string): Promise<MunicipalityOption[]> {
    return this.prisma.municipality.findMany({
      where: { prefectureCode },
      orderBy: { code: "asc" },
      select: { code: true, name: true },
    });
  }
}
