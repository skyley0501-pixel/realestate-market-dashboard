import { describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { Area } from "../../domain/entities/area";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { TrendRate } from "../../domain/value-objects/trend-rate";
import { GetDashboardSummaryUseCase } from "./get-dashboard-summary.usecase";

function buildSnapshot(
  code: string,
  medianYen: number,
  avgUnitPriceYenPerSqm: number,
  transactionCount: number,
  trendRatePercent: number | null,
): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code, name: "千代田区", prefectureCode: "13", prefectureName: "東京都" }),
    period: "2025Q4",
    statistics: PriceStatistics.reconstruct(
      Money.fromYen(medianYen),
      Money.fromYen(medianYen),
      Money.fromYen(medianYen),
      Money.fromYen(medianYen),
      100,
    ),
    trendRate: trendRatePercent !== null ? TrendRate.reconstruct(trendRatePercent) : null,
    avgUnitPriceYenPerSqm,
    transactionCount,
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

describe("GetDashboardSummaryUseCase", () => {
  it("正常系: エリア数・取引総数・各種平均値を算出する", async () => {
    const snapshots = [
      buildSnapshot("13101", 50_000_000, 2_000_000, 100, 10),
      buildSnapshot("13102", 100_000_000, 1_000_000, 200, -10),
      buildSnapshot("13103", 60_000_000, 1_500_000, 50, null),
    ];
    const repository = buildMockRepository({ findLatestSnapshots: vi.fn().mockResolvedValue(snapshots) });
    const useCase = new GetDashboardSummaryUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (summary) => {
        expect(summary.latestPeriod).toBe("2025Q4");
        expect(summary.areaCount).toBe(3);
        expect(summary.totalTransactionCount).toBe(350);
        expect(summary.avgUnitPriceYenPerSqm).toBeCloseTo(1_500_000);
        expect(summary.avgMedianPriceYen).toBeCloseTo(70_000_000);
        // trendRateがnullのエリアは平均計算から除外される
        expect(summary.avgTrendRatePercent).toBeCloseTo(0);
      },
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("全エリアのtrendRateがnullの場合、avgTrendRatePercentはnullになる", async () => {
    const snapshots = [buildSnapshot("13101", 50_000_000, 2_000_000, 100, null)];
    const repository = buildMockRepository({ findLatestSnapshots: vi.fn().mockResolvedValue(snapshots) });
    const useCase = new GetDashboardSummaryUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (summary) => expect(summary.avgTrendRatePercent).toBeNull(),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("エリアが1件も無い場合はゼロ値のサマリーを返す", async () => {
    const repository = buildMockRepository({ findLatestSnapshots: vi.fn().mockResolvedValue([]) });
    const useCase = new GetDashboardSummaryUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (summary) => {
        expect(summary.latestPeriod).toBeNull();
        expect(summary.areaCount).toBe(0);
        expect(summary.totalTransactionCount).toBe(0);
        expect(summary.avgUnitPriceYenPerSqm).toBe(0);
        expect(summary.avgMedianPriceYen).toBe(0);
        expect(summary.avgTrendRatePercent).toBeNull();
      },
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("Repositoryが例外を投げた場合はDASHBOARD_SUMMARY_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findLatestSnapshots: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetDashboardSummaryUseCase(repository);

    const result = await useCase.execute();

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("DASHBOARD_SUMMARY_FAILED"),
    );
  });
});
