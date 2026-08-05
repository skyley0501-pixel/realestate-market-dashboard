import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { CompareAreasUseCase } from "./compare-areas.usecase";

function buildSnapshot(code: string): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code, name: "千代田区", prefectureCode: "13", prefectureName: "東京都" }),
    period: "2025Q4",
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
    findLatestSnapshotsByCodes: vi.fn(),
    ...overrides,
  };
}

describe("CompareAreasUseCase", () => {
  it("正常系: 2〜4エリアを指定するとリポジトリから取得したスナップショットを返す", async () => {
    const snapshots = [buildSnapshot("13101"), buildSnapshot("13102")];
    const repository = buildMockRepository({
      findLatestSnapshotsByCodes: vi.fn().mockResolvedValue(snapshots),
    });
    const useCase = new CompareAreasUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102"] });

    result.match(
      (value) => expect(value).toHaveLength(2),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findLatestSnapshotsByCodes).toHaveBeenCalledWith(["13101", "13102"]);
  });

  it("正常系: 4エリア指定でも受け付ける", async () => {
    const repository = buildMockRepository({
      findLatestSnapshotsByCodes: vi.fn().mockResolvedValue([]),
    });
    const useCase = new CompareAreasUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102", "13103", "13104"] });

    expect(result.isOk).toBe(true);
  });

  it("エリア指定が1件以下の場合はCOMPARE_INVALID_CODESのResult.errを返し、リポジトリを呼ばない", async () => {
    const repository = buildMockRepository();
    const useCase = new CompareAreasUseCase(repository);

    const result = await useCase.execute({ codes: ["13101"] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("COMPARE_INVALID_CODES"),
    );
    expect(repository.findLatestSnapshotsByCodes).not.toHaveBeenCalled();
  });

  it("エリア指定が5件以上の場合もCOMPARE_INVALID_CODESのResult.errを返す", async () => {
    const repository = buildMockRepository();
    const useCase = new CompareAreasUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102", "13103", "13104", "13105"] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("COMPARE_INVALID_CODES"),
    );
    expect(repository.findLatestSnapshotsByCodes).not.toHaveBeenCalled();
  });

  it("Repositoryが例外を投げた場合はCOMPARE_FETCH_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshotsByCodes: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new CompareAreasUseCase(repository);

    const result = await useCase.execute({ codes: ["13101", "13102"] });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("COMPARE_FETCH_FAILED"),
    );
  });
});
