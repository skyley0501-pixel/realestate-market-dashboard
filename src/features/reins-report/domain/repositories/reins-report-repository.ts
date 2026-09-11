import type { ReinsMarketStat, ReinsPropertyType, ReinsRegion } from "../entities/reins-market-stat";

// Infrastructure層（PrismaReinsReportRepository）が実装するPort
export interface ReinsReportRepository {
  // 指定した地域・種別の月次統計を期間昇順で返す（グラフの時系列表示・前年同月比の算出に使う）
  findHistory(region: ReinsRegion, propertyType: ReinsPropertyType): Promise<ReinsMarketStat[]>;
}
