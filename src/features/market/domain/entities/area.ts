export interface AreaProps {
  code: string;
  name: string;
  prefectureCode: string;
  prefectureName: string;
}

// 市区町村単位の分析対象エリアを表すEntity。同一性はcodeで判定する（名称や境界が変わってもエリアとしての同一性は保たれる）。
export class Area {
  private constructor(private readonly props: AreaProps) {}

  static create(props: AreaProps): Area {
    return new Area(props);
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get prefectureCode(): string {
    return this.props.prefectureCode;
  }

  get prefectureName(): string {
    return this.props.prefectureName;
  }

  equals(other: Area): boolean {
    return this.code === other.code;
  }
}
