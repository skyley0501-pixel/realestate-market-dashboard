import type { AiAreaReport } from "../entities/ai-area-report";

// Infrastructure層（PrismaAiAreaReportRepository、Day36で実装）が実装するPort
export interface AiAreaReportRepository {
  // 指定エリアの生成済みレポートを返す。未生成ならnull（GetAreaReportUseCaseがこれを見てLLM生成の要否を判断する）
  findByAreaCode(areaCode: string): Promise<AiAreaReport | null>;
  save(report: AiAreaReport): Promise<void>;
}
