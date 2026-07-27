import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface GetAreaPriceHistoryInput {
  code: string;
}

export class GetAreaPriceHistoryUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: GetAreaPriceHistoryInput): Promise<Result<AreaMarketSnapshot[], ApplicationError>> {
    try {
      const history = await this.areaRepository.findSnapshotHistoryByCode(input.code);
      return Result.ok(history);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "AREA_PRICE_HISTORY_FAILED",
          `エリアの価格推移取得に失敗しました: ${String(error)}`,
          "価格推移の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
