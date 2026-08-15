import type { Money } from "@/shared/domain/value-objects/money";

// 予測価格の内訳1項目（Day40のFeatureImportanceBarで寄与度を可視化する）
export interface FeatureContribution {
  label: string;
  amountYen: number;
}

export interface PredictionResultProps {
  predictedPriceYen: Money;
  contributions: FeatureContribution[];
}

// PricePredictionModelの出力。不変・値による等価性を持つ値オブジェクト。
export class PredictionResult {
  private constructor(private readonly props: PredictionResultProps) {}

  static create(props: PredictionResultProps): PredictionResult {
    return new PredictionResult(props);
  }

  get predictedPriceYen(): Money {
    return this.props.predictedPriceYen;
  }

  get contributions(): FeatureContribution[] {
    return this.props.contributions;
  }
}
