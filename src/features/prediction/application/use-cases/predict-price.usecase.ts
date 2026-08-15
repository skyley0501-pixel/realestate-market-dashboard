import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import { DomainError } from "@/shared/domain/errors/domain-error";
import type { PricePredictionModel } from "../../domain/services/price-prediction-model";
import { PredictionInput } from "../../domain/value-objects/prediction-input";
import type { PredictionResult } from "../../domain/value-objects/prediction-result";

export interface PredictPriceInput {
  municipalityCode: string;
  areaSqm: number;
  buildingAgeYears: number;
  timeToStationMinutes: number;
}

export class PredictPriceUseCase {
  constructor(private readonly model: PricePredictionModel) {}

  async execute(input: PredictPriceInput): Promise<Result<PredictionResult, ApplicationError>> {
    try {
      const predictionInput = PredictionInput.create(input);
      const result = await this.model.predict(predictionInput);
      return Result.ok(result);
    } catch (error) {
      if (error instanceof DomainError) {
        const userMessage =
          error.code === "AREA_NOT_FOUND_FOR_PREDICTION"
            ? "選択したエリアの統計データがまだありません。別のエリアをお試しください。"
            : error.message;
        return Result.err(new ApplicationError(error.code, error.message, userMessage));
      }
      return Result.err(
        new ApplicationError(
          "PREDICTION_FAILED",
          `価格予測に失敗しました: ${String(error)}`,
          "価格予測に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
