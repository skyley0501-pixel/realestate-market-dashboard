import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { GetTrendsUseCase } from "./get-trends.usecase";

function buildSnapshot(code: string, period: string): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code, name: "千代田区", prefectureCode: "13", prefectureName: "東京都" }),
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
    findSnapshotHistoryByCodes: vi.fn(),
    ...overrides,
  };
}

describe("GetTrendsUseCase", () => {
  it("正常系: 2エリア以上を指定するとリポジトリから取得した履歴を返す", async () => {
    const history = [buildSnapshot("13101", "2025Q4"), buildSnapshot("13102", "2025Q4")];
    const repository = buildMockRepository({
      findSnapshotHistoryByCodes: vi.fn().mockResolvedValue(history),
    });
    const useCase = new GetTrendsUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102"] });

    result.match(
      (value) => expect(value).toHaveLength(2),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findSnapshotHistoryByCodes).toHaveBeenCalledWith(["13101", "13102"]);
  });

  it("エリア指定が1件以下の場合はTREND_INVALID_CODESのResult.errを返し、リポジトリを呼ばない", async () => {
    const repository = buildMockRepository();
    const useCase = new GetTrendsUseCase(repository);

    const result = await useCase.execute({ codes: ["13101"] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TREND_INVALID_CODES"),
    );
    expect(repository.findSnapshotHistoryByCodes).not.toHaveBeenCalled();
  });

  it("エリア指定が0件の場合もTREND_INVALID_CODESのResult.errを返す", async () => {
    const repository = buildMockRepository();
    const useCase = new GetTrendsUseCase(repository);

    const result = await useCase.execute({ codes: [] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TREND_INVALID_CODES"),
    );
  });

  it("Repositoryが例外を投げた場合はTREND_FETCH_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findSnapshotHistoryByCodes: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetTrendsUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102"] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TREND_FETCH_FAILED"),
    );
  });
});
