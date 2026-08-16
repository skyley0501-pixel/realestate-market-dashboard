import type { AiAreaReport } from "../../domain/entities/ai-area-report";

export interface AiAreaReportDto {
  areaCode: string;
  period: string;
  content: string;
  generatedAt: string;
}

export function toAiAreaReportDto(report: AiAreaReport): AiAreaReportDto {
  return {
    areaCode: report.areaCode,
    period: report.period,
    content: report.content,
    generatedAt: report.generatedAt.toISOString(),
  };
}
