import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { ListAreasUseCase } from "./list-areas.usecase";

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
    ...overrides,
  };
}

describe("ListAreasUseCase", () => {
  it("正常系: リポジトリから取得したスナップショット一覧を返す", async () => {
    const snapshots = [buildSnapshot("13101"), buildSnapshot("13102")];
    const repository = buildMockRepository({
      findLatestSnapshots: vi.fn().mockResolvedValue(snapshots),
    });
    const useCase = new ListAreasUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (value) => expect(value).toHaveLength(2),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("Repositoryが例外を投げた場合はAREA_LIST_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshots: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new ListAreasUseCase(repository);

    const result = await useCase.execute();

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_LIST_FAILED"),
    );
  });
});
