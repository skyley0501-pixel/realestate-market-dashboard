import type { Transaction } from "@/features/transaction/domain/entities/transaction";
import { AreaMarketSnapshot } from "../aggregates/area-market-snapshot";
import type { Area } from "../entities/area";
import { PriceStatistics } from "../value-objects/price-statistics";
import { TrendRate } from "../value-objects/trend-rate";

// 単一のエンティティに属さない「統計量の算出」「前期比の算出」を担うドメインサービス。
// 外部依存を持たない純粋な計算ロジックのため、interfaceを介さず直接利用する。
export class MarketStatisticsCalculator {
  calculateSnapshot(
    area: Area,
    transactions: Transaction[],
    period: string,
    previousStatistics: PriceStatistics | null = null,
  ): AreaMarketSnapshot {
    const statistics = PriceStatistics.calculate(transactions.map((transaction) => transaction.price));
    const trendRate = previousStatistics ? this.calculateTrendRate(statistics, previousStatistics) : null;

    return AreaMarketSnapshot.create({ area, period, statistics, trendRate });
  }

  // 中央値（外れ値の影響を受けにくい代表値）を基準に前期比を算出する
  calculateTrendRate(current: PriceStatistics, previous: PriceStatistics): TrendRate {
    return TrendRate.calculate(current.median, previous.median);
  }
}
