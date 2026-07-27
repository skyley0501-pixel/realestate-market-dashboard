import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface GetAreaDetailInput {
  code: string;
}

export class GetAreaDetailUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: GetAreaDetailInput): Promise<Result<AreaMarketSnapshot, ApplicationError>> {
    try {
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
      return Result.ok(snapshot);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "AREA_DETAIL_FAILED",
          `エリア詳細の取得に失敗しました: ${String(error)}`,
          "エリア詳細の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
