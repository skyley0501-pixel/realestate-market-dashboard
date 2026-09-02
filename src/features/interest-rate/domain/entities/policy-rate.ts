export interface PolicyRateProps {
  effectiveDate: Date; // この金利が適用され始めた日
  ratePercent: number;
  note: string | null; // 例: "2026年9月 金融政策決定会合"
}

// 日銀の政策金利（無担保コールレート翌日物の誘導目標水準）を表すEntity。
// 金融政策決定会合の都度、手動で追加される（詳細はscripts/README等の運用メモ参照）。
export class PolicyRate {
  private constructor(private readonly props: PolicyRateProps) {}

  static create(props: PolicyRateProps): PolicyRate {
    return new PolicyRate(props);
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate;
  }

  get ratePercent(): number {
    return this.props.ratePercent;
  }

  get note(): string | null {
    return this.props.note;
  }
}
