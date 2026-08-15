import { describe, expect, it } from "vitest";
import { InvalidPredictionInputError, PredictionInput } from "./prediction-input";

function validProps() {
  return { municipalityCode: "13113", areaSqm: 40, buildingAgeYears: 5, timeToStationMinutes: 8 };
}

describe("PredictionInput", () => {
  it("正常な値でインスタンスを生成できる", () => {
    const input = PredictionInput.create(validProps());

    expect(input.municipalityCode).toBe("13113");
    expect(input.areaSqm).toBe(40);
    expect(input.buildingAgeYears).toBe(5);
    expect(input.timeToStationMinutes).toBe(8);
  });

  it("municipalityCodeが空の場合はInvalidPredictionInputErrorを投げる", () => {
    expect(() => PredictionInput.create({ ...validProps(), municipalityCode: "" })).toThrow(
      InvalidPredictionInputError,
    );
  });

  it("areaSqmが0以下の場合はInvalidPredictionInputErrorを投げる", () => {
    expect(() => PredictionInput.create({ ...validProps(), areaSqm: 0 })).toThrow(InvalidPredictionInputError);
  });

  it("buildingAgeYearsが負の場合はInvalidPredictionInputErrorを投げる", () => {
    expect(() => PredictionInput.create({ ...validProps(), buildingAgeYears: -1 })).toThrow(
      InvalidPredictionInputError,
    );
  });

  it("timeToStationMinutesが負の場合はInvalidPredictionInputErrorを投げる", () => {
    expect(() => PredictionInput.create({ ...validProps(), timeToStationMinutes: -1 })).toThrow(
      InvalidPredictionInputError,
    );
  });
});
