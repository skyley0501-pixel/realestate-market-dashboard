import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { ReinsMarketStat, ReinsRegion } from "../../domain/entities/reins-market-stat";
import type { ReinsReportRepository } from "../../domain/repositories/reins-report-repository";

// エリア別直近表に表示する順（都心から順に、都区部→都全体→3県）
const AREA_REGIONS: ReinsRegion[] = ["東京都区部", "東京都", "神奈川県", "千葉県", "埼玉県"];

export interface ReinsAreaHistory {
  region: ReinsRegion;
  history: ReinsMarketStat[]; // 期間昇順（前年同月比の算出に直近13ヶ月分を使う）
}

export interface ReinsReport {
  metroCondoHistory: ReinsMarketStat[]; // 首都圏マンション（成約・新規登録・在庫）の月次推移
  metroDetachedHistory: ReinsMarketStat[]; // 首都圏戸建の月次推移
  areaCondoHistories: ReinsAreaHistory[]; // 都道府県・都区部別マンションの月次推移（エリア別直近表用）
}

export class GetReinsReportUseCase {
  constructor(private readonly reinsReportRepository: ReinsReportRepository) {}

  async execute(): Promise<Result<ReinsReport, ApplicationError>> {
    try {
      const [metroCondoHistory, metroDetachedHistory, areaHistories] = await Promise.all([
        this.reinsReportRepository.findHistory("首都圏", "マンション"),
        this.reinsReportRepository.findHistory("首都圏", "戸建"),
        Promise.all(
          AREA_REGIONS.map(async (region) => ({
            region,
            history: await this.reinsReportRepository.findHistory(region, "マンション"),
          })),
        ),
      ]);

      return Result.ok({ metroCondoHistory, metroDetachedHistory, areaCondoHistories: areaHistories });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "REINS_REPORT_FETCH_FAILED",
          `レインズ市場統計の取得に失敗しました: ${String(error)}`,
          "市場統計の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
