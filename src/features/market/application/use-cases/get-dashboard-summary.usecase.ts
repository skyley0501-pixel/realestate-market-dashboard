import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface DashboardSummary {
  areaCount: number;
  totalTransactionCount: number;
  avgUnitPriceYenPerSqm: number;
  avgMedianPriceYen: number;
  avgTrendRatePercent: number | null;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export class GetDashboardSummaryUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(): Promise<Result<DashboardSummary, ApplicationError>> {
    try {
      const snapshots = await this.areaRepository.findLatestSnapshots();

      if (snapshots.length === 0) {
        return Result.ok({
          areaCount: 0,
          totalTransactionCount: 0,
          avgUnitPriceYenPerSqm: 0,
          avgMedianPriceYen: 0,
          avgTrendRatePercent: null,
        });
      }

      const trendRates = snapshots
        .map((s) => s.trendRate?.percent)
        .filter((v): v is number => v !== null && v !== undefined);

      return Result.ok({
        areaCount: snapshots.length,
        totalTransactionCount: snapshots.reduce((sum, s) => sum + s.transactionCount, 0),
        avgUnitPriceYenPerSqm: average(snapshots.map((s) => s.avgUnitPriceYenPerSqm)),
        avgMedianPriceYen: average(snapshots.map((s) => Number(s.statistics.median.yen))),
        avgTrendRatePercent: trendRates.length > 0 ? average(trendRates) : null,
      });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "DASHBOARD_SUMMARY_FAILED",
          `ダッシュボードサマリーの取得に失敗しました: ${String(error)}`,
          "ダッシュボードサマリーの取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
