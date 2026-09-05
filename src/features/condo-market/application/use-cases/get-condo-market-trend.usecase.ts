import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { CondoMarketStat } from "../../domain/entities/condo-market-stat";
import type { CondoSupply } from "../../domain/entities/condo-supply";
import type { CondoMarketRepository } from "../../domain/repositories/condo-market-repository";

export interface CondoMarketTrend {
  condoSupply: CondoSupply[];
  condoMarketStats: CondoMarketStat[];
}

export class GetCondoMarketTrendUseCase {
  constructor(private readonly condoMarketRepository: CondoMarketRepository) {}

  async execute(): Promise<Result<CondoMarketTrend, ApplicationError>> {
    try {
      const [condoSupply, condoMarketStats] = await Promise.all([
        this.condoMarketRepository.findAllCondoSupply(),
        this.condoMarketRepository.findAllCondoMarketStats(),
      ]);

      return Result.ok({ condoSupply, condoMarketStats });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "CONDO_MARKET_TREND_FETCH_FAILED",
          `マンション市場動向の取得に失敗しました: ${String(error)}`,
          "マンション市場動向の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
