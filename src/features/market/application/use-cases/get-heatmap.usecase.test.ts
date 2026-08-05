import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { GetHeatmapUseCase } from "./get-heatmap.usecase";

function buildSnapshot(
  code: string,
  name: string,
  prefectureCode: string,
  prefectureName: string,
  avgUnitPriceYenPerSqm: number,
): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code, name, prefectureCode, prefectureName }),
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

describe("GetHeatmapUseCase", () => {
  it("municipality粒度の場合、市区町村ごとの坪単価をそのまま返す", async () => {
    const snapshots = [
      buildSnapshot("13101", "千代田区", "13", "東京都", 2_000_000),
      buildSnapshot("13102", "中央区", "13", "東京都", 1_800_000),
    ];
    const repository = buildMockRepository({ findLatestSnapshots: vi.fn().mockResolvedValue(snapshots) });
    const useCase = new GetHeatmapUseCase(repository);

    const result = await useCase.execute({ granularity: "municipality" });

    result.match(
      (cells) => {
        expect(cells).toHaveLength(2);
        expect(cells.find((c) => c.code === "13101")?.avgUnitPriceYenPerSqm).toBe(2_000_000);
      },
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("prefecture粒度の場合、都道府県単位で坪単価を平均する", async () => {
    const snapshots = [
      buildSnapshot("13101", "千代田区", "13", "東京都", 2_000_000),
      buildSnapshot("13102", "中央区", "13", "東京都", 1_000_000),
      buildSnapshot("14101", "鶴見区", "14", "神奈川県", 500_000),
    ];
    const repository = buildMockRepository({ findLatestSnapshots: vi.fn().mockResolvedValue(snapshots) });
    const useCase = new GetHeatmapUseCase(repository);

    const result = await useCase.execute({ granularity: "prefecture" });

    result.match(
      (cells) => {
        expect(cells).toHaveLength(2);
        expect(cells.find((c) => c.code === "13")?.avgUnitPriceYenPerSqm).toBe(1_500_000);
        expect(cells.find((c) => c.code === "14")?.avgUnitPriceYenPerSqm).toBe(500_000);
      },
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("不正なgranularityの場合はHEATMAP_INVALID_GRANULARITYのResult.errを返す", async () => {
    const repository = buildMockRepository();
    const useCase = new GetHeatmapUseCase(repository);

    // @ts-expect-error 不正な値を意図的に渡すテスト
    const result = await useCase.execute({ granularity: "city" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("HEATMAP_INVALID_GRANULARITY"),
    );
    expect(repository.findLatestSnapshots).not.toHaveBeenCalled();
  });

  it("Repositoryが例外を投げた場合はHEATMAP_FETCH_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshots: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetHeatmapUseCase(repository);

    const result = await useCase.execute({ granularity: "municipality" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("HEATMAP_FETCH_FAILED"),
    );
  });
});
