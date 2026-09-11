export type ReinsRegion = "首都圏" | "東京都区部" | "東京都" | "神奈川県" | "千葉県" | "埼玉県";
export type ReinsPropertyType = "マンション" | "戸建";

export interface ReinsMarketStatProps {
  period: string; // "YYYY-MM"
  region: ReinsRegion;
  propertyType: ReinsPropertyType;
  contractCount: number;
  contractUnitPriceManYen: number | null;
  contractPriceManYen: number | null;
  newListingUnitPriceManYen: number | null;
  inventoryCount: number | null;
}

// 東日本レインズ「月例速報マーケットウオッチ」の月次統計1件を表すEntity。
// 同一性は period×region×propertyType で判定する（DBのunique制約と同じ）。
export class ReinsMarketStat {
  private constructor(private readonly props: ReinsMarketStatProps) {}

  static create(props: ReinsMarketStatProps): ReinsMarketStat {
    return new ReinsMarketStat(props);
  }

  get period(): string {
    return this.props.period;
  }

  get region(): ReinsRegion {
    return this.props.region;
  }

  get propertyType(): ReinsPropertyType {
    return this.props.propertyType;
  }

  get contractCount(): number {
    return this.props.contractCount;
  }

  get contractUnitPriceManYen(): number | null {
    return this.props.contractUnitPriceManYen;
  }

  get contractPriceManYen(): number | null {
    return this.props.contractPriceManYen;
  }

  get newListingUnitPriceManYen(): number | null {
    return this.props.newListingUnitPriceManYen;
  }

  get inventoryCount(): number | null {
    return this.props.inventoryCount;
  }
}
