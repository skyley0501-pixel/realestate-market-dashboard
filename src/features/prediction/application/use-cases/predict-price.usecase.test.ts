import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import type { PricePredictionModel } from "../../domain/services/price-prediction-model";
import { PredictionResult } from "../../domain/value-objects/prediction-result";
import { AreaNotFoundForPredictionError } from "../../infrastructure/heuristic-price-prediction-model";
import { PredictPriceUseCase } from "./predict-price.usecase";

function buildMockModel(overrides: Partial<PricePredictionModel> = {}): PricePredictionModel {
  return {
    predict: vi.fn(),
    ...overrides,
  };
}

function validInput() {
  return { municipalityCode: "13113", areaSqm: 40, buildingAgeYears: 5, timeToStationMinutes: 8 };
}

describe("PredictPriceUseCase", () => {
  it("正常系: PricePredictionModelの結果をそのまま返す", async () => {
    const predictionResult = PredictionResult.create({
      predictedPriceYen: Money.fromYen(40_000_000),
      contributions: [{ label: "エリア相場（面積基準）", amountYen: 40_000_000 }],
    });
    const model = buildMockModel({ predict: vi.fn().mockResolvedValue(predictionResult) });
    const useCase = new PredictPriceUseCase(model);

    const result = await useCase.execute(validInput());

    result.match(
      (value) => expect(value.predictedPriceYen.yen).toBe(40_000_000n),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("入力値が不正な場合はINVALID_PREDICTION_INPUTのResult.errを返す（Modelは呼ばれない）", async () => {
    const model = buildMockModel();
    const useCase = new PredictPriceUseCase(model);

    const result = await useCase.execute({ ...validInput(), areaSqm: 0 });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("INVALID_PREDICTION_INPUT"),
    );
    expect(model.predict).not.toHaveBeenCalled();
  });

  it("エリアの統計データが無い場合はAREA_NOT_FOUND_FOR_PREDICTIONのResult.errを返す", async () => {
    const model = buildMockModel({
      predict: vi.fn().mockRejectedValue(new AreaNotFoundForPredictionError("13113")),
    });
    const useCase = new PredictPriceUseCase(model);

    const result = await useCase.execute(validInput());

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => {
        expect(error.code).toBe("AREA_NOT_FOUND_FOR_PREDICTION");
        expect(error.userMessage).toContain("別のエリア");
      },
    );
  });

  it("想定外の例外はPREDICTION_FAILEDのResult.errを返す", async () => {
    const model = buildMockModel({ predict: vi.fn().mockRejectedValue(new Error("unexpected")) });
    const useCase = new PredictPriceUseCase(model);

    const result = await useCase.execute(validInput());

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("PREDICTION_FAILED"),
    );
  });
});
