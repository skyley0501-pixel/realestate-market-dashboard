import type { AiAreaReport } from "../entities/ai-area-report";

// Infrastructure層（PrismaAiAreaReportRepository、Day36で実装）が実装するPort
export interface AiAreaReportRepository {
  // 指定エリア・期間の生成済みレポートを返す。未生成、または統計の対象期間が進んで古いレポートしか
  // 無い場合はnull（GetAreaReportUseCaseがこれを見てLLM再生成の要否を判断する）
  findByAreaCodeAndPeriod(areaCode: string, period: string): Promise<AiAreaReport | null>;
  save(report: AiAreaReport): Promise<void>;
}
