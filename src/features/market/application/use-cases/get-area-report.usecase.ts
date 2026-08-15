import { z } from "zod";
import type { LlmClient } from "@/features/conversation/infrastructure/llm-client";
import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { AiAreaReport } from "../../domain/entities/ai-area-report";
import type { AiAreaReportRepository } from "../../domain/repositories/ai-area-report-repository";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface GetAreaReportInput {
  code: string;
}

const reportSchema = z.object({ content: z.string() });

function buildPrompt(snapshot: AreaMarketSnapshot): string {
  const trendText = snapshot.trendRate ? `${snapshot.trendRate.percent.toFixed(1)}%` : "データなし";
  return [
    `あなたは不動産市場アナリストです。以下の統計データをもとに、${snapshot.area.prefectureName}${snapshot.area.name}の不動産市場について200字程度で講評してください。`,
    `対象期間: ${snapshot.period}`,
    `中央価格: ${snapshot.statistics.median.yen}円`,
    `平均坪単価: ${snapshot.avgUnitPriceYenPerSqm}円/㎡`,
    `前期比: ${trendText}`,
    `取引件数: ${snapshot.transactionCount}件`,
  ].join("\n");
}

export class GetAreaReportUseCase {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly aiAreaReportRepository: AiAreaReportRepository,
    private readonly llmClient: LlmClient,
  ) {}

  async execute(input: GetAreaReportInput): Promise<Result<AiAreaReport, ApplicationError>> {
    try {
      const cached = await this.aiAreaReportRepository.findByAreaCode(input.code);
      if (cached) {
        return Result.ok(cached);
      }

      const snapshot = await this.areaRepository.findLatestSnapshotByCode(input.code);
      if (!snapshot) {
        return Result.err(
          new ApplicationError(
            "AREA_NOT_FOUND",
            `エリアが見つかりません: code=${input.code}`,
            "指定されたエリアが見つかりませんでした。",
          ),
        );
      }

      const generated = await this.llmClient.completeStructured(buildPrompt(snapshot), reportSchema);
      const report = AiAreaReport.create({
        areaCode: input.code,
        content: generated.content,
        generatedAt: new Date(),
      });
      await this.aiAreaReportRepository.save(report);

      return Result.ok(report);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "AREA_REPORT_FAILED",
          `AIエリア講評の生成に失敗しました: ${String(error)}`,
          "AIエリア講評の生成に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
