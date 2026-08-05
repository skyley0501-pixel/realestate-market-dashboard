import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface GetTrendsInput {
  codes: string[];
}

const MIN_COMPARISON_AREAS = 2;

export class GetTrendsUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: GetTrendsInput): Promise<Result<AreaMarketSnapshot[], ApplicationError>> {
    if (input.codes.length < MIN_COMPARISON_AREAS) {
      return Result.err(
        new ApplicationError(
          "TREND_INVALID_CODES",
          `比較には${MIN_COMPARISON_AREAS}エリア以上の指定が必要です: codes=${input.codes.join(",")}`,
          "比較するには2エリア以上選択してください。",
        ),
      );
    }

    try {
      const history = await this.areaRepository.findSnapshotHistoryByCodes(input.codes);
      return Result.ok(history);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "TREND_FETCH_FAILED",
          `トレンド比較データの取得に失敗しました: ${String(error)}`,
          "トレンド比較データの取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
