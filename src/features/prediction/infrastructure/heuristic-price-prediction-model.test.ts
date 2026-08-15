import { AreaMarketSnapshot } from "@/features/market/domain/aggregates/area-market-snapshot";
import { Area } from "@/features/market/domain/entities/area";
import type { AreaRepository } from "@/features/market/domain/repositories/area-repository";
import { PriceStatistics } from "@/features/market/domain/value-objects/price-statistics";
import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import { PredictionInput } from "../domain/value-objects/prediction-input";
import { AreaNotFoundForPredictionError, HeuristicPricePredictionModel } from "./heuristic-price-prediction-model";

function buildSnapshot(avgUnitPriceYenPerSqm: number): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code: "13113", name: "渋谷区", prefectureCode: "13", prefectureName: "東京都" }),
    period: "2025Q4",
    statistics: PriceStatistics.reconstruct(
      Money.fromYen(50_000_000),
      Money.fromYen(52_000_000),
      Money.fromYen(40_000_000),
      Money.fromYen(60_000_000),
      100,
    ),
    trendRate: null,
    avgUnitPriceYenPerSqm,
    transactionCount: 100,
  });
}

function buildMockAreaRepository(overrides: Partial<AreaRepository> = {}): AreaRepository {
  return {
    findLatestSnapshots: vi.fn(),
    findLatestSnapshotByCode: vi.fn(),
    findSnapshotHistoryByCode: vi.fn(),
    findSnapshotHistoryByCodes: vi.fn(),
    findLatestSnapshotsByCodes: vi.fn(),
    ...overrides,
  };
}

describe("HeuristicPricePredictionModel", () => {
  it("新築・駅近の物件はエリア相場（面積基準）に近い予測価格になる", async () => {
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(buildSnapshot(1_000_000)),
    });
    const model = new HeuristicPricePredictionModel(areaRepository);
    const input = PredictionInput.create({
      municipalityCode: "13113",
      areaSqm: 40,
      buildingAgeYears: 0,
      timeToStationMinutes: 0,
    });

    const result = await model.predict(input);

    // basePrice = 1,000,000円/㎡ × 40㎡ = 40,000,000円。減価要因が無いので基準額とほぼ一致する
    expect(result.predictedPriceYen.yen).toBe(40_000_000n);
  });

  it("築年数が古い・駅から遠いほど予測価格が下がる", async () => {
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(buildSnapshot(1_000_000)),
    });
    const model = new HeuristicPricePredictionModel(areaRepository);

    const newInput = PredictionInput.create({
      municipalityCode: "13113",
      areaSqm: 40,
      buildingAgeYears: 0,
      timeToStationMinutes: 0,
    });
    const oldInput = PredictionInput.create({
      municipalityCode: "13113",
      areaSqm: 40,
      buildingAgeYears: 20,
      timeToStationMinutes: 15,
    });

    const newResult = await model.predict(newInput);
    const oldResult = await model.predict(oldInput);

    expect(oldResult.predictedPriceYen.yen).toBeLessThan(newResult.predictedPriceYen.yen);
    // 補正の合計は上限（築年数50%減+駅距離30%減=80%減）を超えないため、基準額の20%以上は残る
    expect(oldResult.predictedPriceYen.yen).toBeGreaterThan(0n);
  });

  it("寄与度の内訳（エリア相場・築年数・駅距離）を返す", async () => {
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(buildSnapshot(1_000_000)),
    });
    const model = new HeuristicPricePredictionModel(areaRepository);
    const input = PredictionInput.create({
      municipalityCode: "13113",
      areaSqm: 40,
      buildingAgeYears: 10,
      timeToStationMinutes: 8,
    });

    const result = await model.predict(input);

    expect(result.contributions).toHaveLength(3);
    expect(result.contributions.map((c) => c.label)).toEqual([
      "エリア相場（面積基準）",
      "築年数による補正",
      "駅距離による補正",
    ]);
    expect(result.contributions[1].amountYen).toBeLessThan(0);
    expect(result.contributions[2].amountYen).toBeLessThan(0);
  });

  it("エリアの統計データが無い場合はAreaNotFoundForPredictionErrorを投げる", async () => {
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(null),
    });
    const model = new HeuristicPricePredictionModel(areaRepository);
    const input = PredictionInput.create({
      municipalityCode: "not-exist",
      areaSqm: 40,
      buildingAgeYears: 5,
      timeToStationMinutes: 5,
    });

    await expect(model.predict(input)).rejects.toThrow(AreaNotFoundForPredictionError);
  });
});
