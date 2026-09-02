import type { InterestRateTrend } from "../../application/use-cases/get-interest-rate-trend.usecase";
import type { JgbYield } from "../../domain/entities/jgb-yield";
import type { PolicyRate } from "../../domain/entities/policy-rate";

export interface JgbYieldDto {
  date: string; // YYYY-MM-DD
  tenYearRate: number;
}

export interface PolicyRateDto {
  effectiveDate: string; // YYYY-MM-DD
  ratePercent: number;
  note: string | null;
}

export interface InterestRateTrendDto {
  jgbYields: JgbYieldDto[];
  policyRates: PolicyRateDto[];
  latestJgbYield: JgbYieldDto | null;
  latestPolicyRate: PolicyRateDto | null;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toJgbYieldDto(yield_: JgbYield): JgbYieldDto {
  return { date: toDateOnly(yield_.date), tenYearRate: yield_.tenYearRate };
}

function toPolicyRateDto(rate: PolicyRate): PolicyRateDto {
  return { effectiveDate: toDateOnly(rate.effectiveDate), ratePercent: rate.ratePercent, note: rate.note };
}

export function toInterestRateTrendDto(trend: InterestRateTrend): InterestRateTrendDto {
  return {
    jgbYields: trend.jgbYields.map(toJgbYieldDto),
    policyRates: trend.policyRates.map(toPolicyRateDto),
    latestJgbYield: trend.latestJgbYield ? toJgbYieldDto(trend.latestJgbYield) : null,
    latestPolicyRate: trend.latestPolicyRate ? toPolicyRateDto(trend.latestPolicyRate) : null,
  };
}
