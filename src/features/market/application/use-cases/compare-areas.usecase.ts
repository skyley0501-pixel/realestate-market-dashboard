import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface CompareAreasInput {
  codes: string[];
}

export const MIN_COMPARE_AREAS = 2;
export const MAX_COMPARE_AREAS = 4;

export class CompareAreasUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: CompareAreasInput): Promise<Result<AreaMarketSnapshot[], ApplicationError>> {
    if (input.codes.length < MIN_COMPARE_AREAS || input.codes.length > MAX_COMPARE_AREAS) {
      return Result.err(
        new ApplicationError(
          "COMPARE_INVALID_CODES",
          `比較には${MIN_COMPARE_AREAS}〜${MAX_COMPARE_AREAS}エリアの指定が必要です: codes=${input.codes.join(",")}`,
          `比較するには${MIN_COMPARE_AREAS}〜${MAX_COMPARE_AREAS}エリアを選択してください。`,
        ),
      );
    }

    try {
      const snapshots = await this.areaRepository.findLatestSnapshotsByCodes(input.codes);
      return Result.ok(snapshots);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "COMPARE_FETCH_FAILED",
          `エリア比較データの取得に失敗しました: ${String(error)}`,
          "エリア比較データの取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
