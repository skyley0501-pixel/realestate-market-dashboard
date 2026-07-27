import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { GetAreaPriceHistoryUseCase } from "./get-area-price-history.usecase";

function buildSnapshot(period: string): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code: "13101", name: "千代田区", prefectureCode: "13", prefectureName: "東京都" }),
    period,
    statistics: PriceStatistics.reconstruct(
      Money.fromYen(50_000_000),
      Money.fromYen(52_000_000),
      Money.fromYen(40_000_000),
      Money.fromYen(60_000_000),
      100,
    ),
    trendRate: null,
    avgUnitPriceYenPerSqm: 800_000,
    transactionCount: 110,
  });
}

function buildMockRepository(overrides: Partial<AreaRepository> = {}): AreaRepository {
  return {
    findLatestSnapshots: vi.fn(),
    findLatestSnapshotByCode: vi.fn(),
    findSnapshotHistoryByCode: vi.fn(),
    ...overrides,
  };
}

describe("GetAreaPriceHistoryUseCase", () => {
  it("正常系: リポジトリから取得した期間昇順の履歴を返す", async () => {
    const history = [buildSnapshot("2025Q3"), buildSnapshot("2025Q4")];
    const repository = buildMockRepository({
      findSnapshotHistoryByCode: vi.fn().mockResolvedValue(history),
    });
    const useCase = new GetAreaPriceHistoryUseCase(repository);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      (value) => expect(value).toHaveLength(2),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findSnapshotHistoryByCode).toHaveBeenCalledWith("13101");
  });

  it("Repositoryが例外を投げた場合はAREA_PRICE_HISTORY_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findSnapshotHistoryByCode: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetAreaPriceHistoryUseCase(repository);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_PRICE_HISTORY_FAILED"),
    );
  });
});
