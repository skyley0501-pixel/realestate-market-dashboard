import type { AiAreaReport } from "../../domain/entities/ai-area-report";

export interface AiAreaReportDto {
  areaCode: string;
  content: string;
  generatedAt: string;
}

export function toAiAreaReportDto(report: AiAreaReport): AiAreaReportDto {
  return {
    areaCode: report.areaCode,
    content: report.content,
    generatedAt: report.generatedAt.toISOString(),
  };
}
