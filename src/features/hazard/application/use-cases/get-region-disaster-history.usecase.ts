import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { DisasterHistory } from "../../domain/entities/disaster-history";
import type { HazardRepository } from "../../domain/repositories/hazard-repository";

export class GetRegionDisasterHistoryUseCase {
  constructor(private readonly hazardRepository: HazardRepository) {}

  async execute(): Promise<Result<DisasterHistory[], ApplicationError>> {
    try {
      const histories = await this.hazardRepository.findAllDisasterHistories();
      return Result.ok(histories);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "REGION_DISASTER_HISTORY_FETCH_FAILED",
          `ハザードマップの取得に失敗しました: ${String(error)}`,
          "ハザードマップの取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
