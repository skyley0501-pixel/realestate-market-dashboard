export interface CondoSupplyProps {
  prefectureCode: string;
  prefectureName: string;
  fiscalYear: number;
  unitsStarted: number;
}

// 新築分譲マンションの着工戸数1件（都道府県×年度）を表すEntity。
// 国交省「建築着工統計調査」由来（scripts/fetch-condo-supply.ts参照）。
export class CondoSupply {
  private constructor(private readonly props: CondoSupplyProps) {}

  static create(props: CondoSupplyProps): CondoSupply {
    return new CondoSupply(props);
  }

  get prefectureCode(): string {
    return this.props.prefectureCode;
  }

  get prefectureName(): string {
    return this.props.prefectureName;
  }

  get fiscalYear(): number {
    return this.props.fiscalYear;
  }

  get unitsStarted(): number {
    return this.props.unitsStarted;
  }
}
