import { Money } from "@/shared/domain/value-objects/money";

export interface CondoMarketStatProps {
  prefectureCode: string;
  prefectureName: string;
  period: string;
  medianPrice: Money;
  averagePrice: Money;
  sampleSize: number;
  transactionCount: number;
}

// 中古マンションの都道府県×四半期の取引統計1件を表すEntity。
// REMDA自身の実取引データから集計（scripts/aggregate-condo-market-stats.ts参照）。
export class CondoMarketStat {
  private constructor(private readonly props: CondoMarketStatProps) {}

  static create(props: CondoMarketStatProps): CondoMarketStat {
    return new CondoMarketStat(props);
  }

  get prefectureCode(): string {
    return this.props.prefectureCode;
  }

  get prefectureName(): string {
    return this.props.prefectureName;
  }

  get period(): string {
    return this.props.period;
  }

  get medianPrice(): Money {
    return this.props.medianPrice;
  }

  get averagePrice(): Money {
    return this.props.averagePrice;
  }

  get sampleSize(): number {
    return this.props.sampleSize;
  }

  get transactionCount(): number {
    return this.props.transactionCount;
  }
}
