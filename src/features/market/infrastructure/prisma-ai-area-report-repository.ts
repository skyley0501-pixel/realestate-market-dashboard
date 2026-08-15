import type { PrismaClient } from "@/generated/prisma/client";
import { AiAreaReport } from "../domain/entities/ai-area-report";
import type { AiAreaReportRepository } from "../domain/repositories/ai-area-report-repository";

export class PrismaAiAreaReportRepository implements AiAreaReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAreaCode(areaCode: string): Promise<AiAreaReport | null> {
    const row = await this.prisma.aiAreaReport.findUnique({
      where: { municipalityCode: areaCode },
    });
    if (!row) return null;

    return AiAreaReport.create({
      areaCode: row.municipalityCode,
      content: row.content,
      generatedAt: row.generatedAt,
    });
  }

  async save(report: AiAreaReport): Promise<void> {
    await this.prisma.aiAreaReport.upsert({
      where: { municipalityCode: report.areaCode },
      create: {
        municipalityCode: report.areaCode,
        content: report.content,
        generatedAt: report.generatedAt,
      },
      update: {
        content: report.content,
        generatedAt: report.generatedAt,
      },
    });
  }
}
