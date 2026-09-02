export interface JgbYieldProps {
  date: Date;
  tenYearRate: number; // 10年債利回り（%）
}

// 日本国債（10年物）の利回りを表すEntity。同一性は日付で判定する（財務省公表値は日次で洗い替えされうる）。
export class JgbYield {
  private constructor(private readonly props: JgbYieldProps) {}

  static create(props: JgbYieldProps): JgbYield {
    return new JgbYield(props);
  }

  get date(): Date {
    return this.props.date;
  }

  get tenYearRate(): number {
    return this.props.tenYearRate;
  }
}
