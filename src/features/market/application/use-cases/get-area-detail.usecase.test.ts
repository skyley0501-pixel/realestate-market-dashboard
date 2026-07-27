import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { TrendRate } from "../../domain/value-objects/trend-rate";
import { GetAreaDetailUseCase } from "./get-area-detail.usecase";

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
    trendRate: TrendRate.reconstruct(11.11),
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

describe("GetAreaDetailUseCase", () => {
  it("正常系: 該当するAreaMarketSnapshotを返す", async () => {
    const snapshot = buildSnapshot("13101");
    const repository = buildMockRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(snapshot),
    });
    const useCase = new GetAreaDetailUseCase(repository);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      (value) => expect(value.area.code).toBe("13101"),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findLatestSnapshotByCode).toHaveBeenCalledWith("13101");
  });

  it("存在しないコードの場合はAREA_NOT_FOUNDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetAreaDetailUseCase(repository);

    const result = await useCase.execute({ code: "not-exist" });

    expect(result.isOk).toBe(false);
    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_NOT_FOUND"),
    );
  });

  it("Repositoryが例外を投げた場合はAREA_DETAIL_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshotByCode: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetAreaDetailUseCase(repository);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_DETAIL_FAILED"),
    );
  });
});
