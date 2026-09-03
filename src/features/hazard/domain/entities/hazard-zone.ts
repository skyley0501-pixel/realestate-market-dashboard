export interface HazardZoneProps {
  floodZone: boolean;
  landslideZone: boolean;
  checkedAt: Date;
}

// 市区町村単位の水害・土砂災害リスク該当有無を表すEntity。
// scripts/fetch-hazard-zones.tsが国交省「不動産情報ライブラリ」防災情報APIで判定した結果を保持する。
export class HazardZone {
  private constructor(private readonly props: HazardZoneProps) {}

  static create(props: HazardZoneProps): HazardZone {
    return new HazardZone(props);
  }

  get floodZone(): boolean {
    return this.props.floodZone;
  }

  get landslideZone(): boolean {
    return this.props.landslideZone;
  }

  get checkedAt(): Date {
    return this.props.checkedAt;
  }
}
