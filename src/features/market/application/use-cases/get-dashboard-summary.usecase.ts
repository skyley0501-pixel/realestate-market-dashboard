import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export interface PrefectureSummary {
  prefectureCode: string;
  prefectureName: string;
  areaCount: number;
  totalTransactionCount: number;
  avgUnitPriceYenPerSqm: number;
  avgMedianPriceYen: number;
  avgTrendRatePercent: number | null;
}

export interface DashboardSummary {
  latestPeriod: string | null;
  areaCount: number;
  totalTransactionCount: number;
  byPrefecture: PrefectureSummary[];
}

// 港区のような都心部と山間部の町村を同じ平均に混ぜると実態を見誤るため、
// 坪単価・前期比・中央値は都道府県単位で分けて算出する。エリア数・取引総数は単純合計のため混ぜても問題ない。
const PREFECTURE_DISPLAY_ORDER = ["13", "14", "12", "11"]; // 東京都・神奈川県・千葉県・埼玉県

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function summarizePrefecture(prefectureCode: string, snapshots: AreaMarketSnapshot[]): PrefectureSummary {
  const trendRates = snapshots
    .map((s) => s.trendRate?.percent)
    .filter((v): v is number => v !== null && v !== undefined);

  return {
    prefectureCode,
    prefectureName: snapshots[0].area.prefectureName,
    areaCount: snapshots.length,
    totalTransactionCount: snapshots.reduce((sum, s) => sum + s.transactionCount, 0),
    avgUnitPriceYenPerSqm: average(snapshots.map((s) => s.avgUnitPriceYenPerSqm)),
    avgMedianPriceYen: average(snapshots.map((s) => Number(s.statistics.median.yen))),
    avgTrendRatePercent: trendRates.length > 0 ? average(trendRates) : null,
  };
}

export class GetDashboardSummaryUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(): Promise<Result<DashboardSummary, ApplicationError>> {
    try {
      const snapshots = await this.areaRepository.findLatestSnapshots();

      if (snapshots.length === 0) {
        return Result.ok({
          latestPeriod: null,
          areaCount: 0,
          totalTransactionCount: 0,
          byPrefecture: [],
        });
      }

      const snapshotsByPrefecture = new Map<string, AreaMarketSnapshot[]>();
      for (const snapshot of snapshots) {
        const list = snapshotsByPrefecture.get(snapshot.area.prefectureCode) ?? [];
        list.push(snapshot);
        snapshotsByPrefecture.set(snapshot.area.prefectureCode, list);
      }

      const byPrefecture = PREFECTURE_DISPLAY_ORDER.map((code) => snapshotsByPrefecture.get(code))
        .filter((group): group is AreaMarketSnapshot[] => group !== undefined && group.length > 0)
        .map((group) => summarizePrefecture(group[0].area.prefectureCode, group));

      return Result.ok({
        latestPeriod: snapshots[0].period,
        areaCount: snapshots.length,
        totalTransactionCount: snapshots.reduce((sum, s) => sum + s.transactionCount, 0),
        byPrefecture,
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
