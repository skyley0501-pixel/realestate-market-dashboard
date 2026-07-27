import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export class ListAreasUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(): Promise<Result<AreaMarketSnapshot[], ApplicationError>> {
    try {
      const snapshots = await this.areaRepository.findLatestSnapshots();
      return Result.ok(snapshots);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "AREA_LIST_FAILED",
          `エリア一覧の取得に失敗しました: ${String(error)}`,
          "エリア一覧の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
