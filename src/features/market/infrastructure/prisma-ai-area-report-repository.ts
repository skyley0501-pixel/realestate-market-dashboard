import type { PrismaClient } from "@/generated/prisma/client";
import { AiAreaReport } from "../domain/entities/ai-area-report";
import type { AiAreaReportRepository } from "../domain/repositories/ai-area-report-repository";

export class PrismaAiAreaReportRepository implements AiAreaReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAreaCodeAndPeriod(areaCode: string, period: string): Promise<AiAreaReport | null> {
    const row = await this.prisma.aiAreaReport.findUnique({
      where: { municipalityCode_period: { municipalityCode: areaCode, period } },
    });
    if (!row) return null;

    return AiAreaReport.create({
      areaCode: row.municipalityCode,
      period: row.period,
      content: row.content,
      generatedAt: row.generatedAt,
    });
  }

  async save(report: AiAreaReport): Promise<void> {
    await this.prisma.aiAreaReport.upsert({
      where: { municipalityCode_period: { municipalityCode: report.areaCode, period: report.period } },
      create: {
        municipalityCode: report.areaCode,
        period: report.period,
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
