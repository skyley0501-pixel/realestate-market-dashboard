import type { InterestRateTrend } from "../../application/use-cases/get-interest-rate-trend.usecase";
import type { JgbYield } from "../../domain/entities/jgb-yield";
import type { PolicyRate } from "../../domain/entities/policy-rate";
import type { RateNews, RateNewsSource } from "../../domain/entities/rate-news";

export interface JgbYieldDto {
  date: string; // YYYY-MM-DD
  tenYearRate: number;
}

export interface PolicyRateDto {
  effectiveDate: string; // YYYY-MM-DD
  ratePercent: number;
  note: string | null;
}

export interface RateNewsDto {
  source: RateNewsSource;
  title: string;
  url: string;
  publishedAt: string; // YYYY-MM-DD
}

export interface InterestRateTrendDto {
  jgbYields: JgbYieldDto[];
  policyRates: PolicyRateDto[];
  latestJgbYield: JgbYieldDto | null;
  latestPolicyRate: PolicyRateDto | null;
  rateNews: RateNewsDto[];
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

function toRateNewsDto(news: RateNews): RateNewsDto {
  return { source: news.source, title: news.title, url: news.url, publishedAt: toDateOnly(news.publishedAt) };
}

export function toInterestRateTrendDto(trend: InterestRateTrend): InterestRateTrendDto {
  return {
    jgbYields: trend.jgbYields.map(toJgbYieldDto),
    policyRates: trend.policyRates.map(toPolicyRateDto),
    latestJgbYield: trend.latestJgbYield ? toJgbYieldDto(trend.latestJgbYield) : null,
    latestPolicyRate: trend.latestPolicyRate ? toPolicyRateDto(trend.latestPolicyRate) : null,
    rateNews: trend.rateNews.map(toRateNewsDto),
  };
}
