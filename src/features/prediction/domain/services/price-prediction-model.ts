import type { PredictionInput } from "../value-objects/prediction-input";
import type { PredictionResult } from "../value-objects/prediction-result";

// 初期実装はInfrastructure層のHeuristicPricePredictionModel（統計的手法）。将来Python製MLサービスを
// 呼ぶRemoteMlPricePredictionModelに差し替えてもApplication/Presentation層は変更不要（Portパターン）。
export interface PricePredictionModel {
  predict(input: PredictionInput): Promise<PredictionResult>;
}
