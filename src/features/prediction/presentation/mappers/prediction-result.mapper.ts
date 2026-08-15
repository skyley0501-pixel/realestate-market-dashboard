import type { FeatureContribution, PredictionResult } from "../../domain/value-objects/prediction-result";

// JSON.stringifyはbigintを扱えないため、金額は文字列として返す
export interface PredictionResultDto {
  predictedPriceYen: string;
  contributions: FeatureContribution[];
}

export function toPredictionResultDto(result: PredictionResult): PredictionResultDto {
  return {
    predictedPriceYen: result.predictedPriceYen.yen.toString(),
    contributions: result.contributions,
  };
}
