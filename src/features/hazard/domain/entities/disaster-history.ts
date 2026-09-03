export interface DisasterHistoryProps {
  disasterTypeCode: string;
  disasterName: string;
  occurredOn: Date;
  source: string | null;
}

// 過去に発生した水害・土砂災害の履歴1件を表すEntity（国土調査「土地履歴調査」由来）。
// 本文は保持しない（著作権配慮のため転載しない）。同一性は市区町村×種別×発生日で判定する。
export class DisasterHistory {
  private constructor(private readonly props: DisasterHistoryProps) {}

  static create(props: DisasterHistoryProps): DisasterHistory {
    return new DisasterHistory(props);
  }

  get disasterTypeCode(): string {
    return this.props.disasterTypeCode;
  }

  get disasterName(): string {
    return this.props.disasterName;
  }

  get occurredOn(): Date {
    return this.props.occurredOn;
  }

  get source(): string | null {
    return this.props.source;
  }
}
