import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { JgbYield } from "../../domain/entities/jgb-yield";
import type { PolicyRate } from "../../domain/entities/policy-rate";
import type { RateNews } from "../../domain/entities/rate-news";
import type { InterestRateRepository } from "../../domain/repositories/interest-rate-repository";

const RATE_NEWS_LIMIT = 10;

export interface InterestRateTrend {
  jgbYields: JgbYield[];
  policyRates: PolicyRate[];
  latestJgbYield: JgbYield | null;
  latestPolicyRate: PolicyRate | null;
  rateNews: RateNews[];
}

export class GetInterestRateTrendUseCase {
  constructor(private readonly interestRateRepository: InterestRateRepository) {}

  async execute(): Promise<Result<InterestRateTrend, ApplicationError>> {
    try {
      const [jgbYields, policyRates, latestJgbYield, latestPolicyRate, rateNews] = await Promise.all([
        this.interestRateRepository.findJgbYieldHistory(),
        this.interestRateRepository.findPolicyRateHistory(),
        this.interestRateRepository.findLatestJgbYield(),
        this.interestRateRepository.findLatestPolicyRate(),
        this.interestRateRepository.findLatestRateNews(RATE_NEWS_LIMIT),
      ]);

      return Result.ok({ jgbYields, policyRates, latestJgbYield, latestPolicyRate, rateNews });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "INTEREST_RATE_TREND_FETCH_FAILED",
          `金利トレンドの取得に失敗しました: ${String(error)}`,
          "金利情報の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
