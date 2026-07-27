import type { Area } from "../entities/area";
import type { PriceStatistics } from "../value-objects/price-statistics";
import type { TrendRate } from "../value-objects/trend-rate";

export interface AreaMarketSnapshotProps {
  area: Area;
  period: string;
  statistics: PriceStatistics;
  trendRate: TrendRate | null;
}

// エリア・対象期間・価格統計・前期比を一つの整合性単位として扱う集約。
// 前期データが存在しない期間（データ収集開始直後等）ではtrendRateはnullになる。
export class AreaMarketSnapshot {
  private constructor(private readonly props: AreaMarketSnapshotProps) {}

  static create(props: AreaMarketSnapshotProps): AreaMarketSnapshot {
    return new AreaMarketSnapshot(props);
  }

  get area(): Area {
    return this.props.area;
  }

  get period(): string {
    return this.props.period;
  }

  get statistics(): PriceStatistics {
    return this.props.statistics;
  }

  get trendRate(): TrendRate | null {
    return this.props.trendRate;
  }
}
