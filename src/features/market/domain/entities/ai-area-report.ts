export interface AiAreaReportProps {
  areaCode: string;
  // 講評が参照した統計スナップショットの対象期間（例: "2026Q1"）。areaCode+periodでキャッシュキーとし、
  // 期間が進んでも古い期間の講評を返し続けないようにする。
  period: string;
  content: string;
  generatedAt: Date;
}

// エリアの市況をAIが要約した講評文。同一エリア・同一期間の集計に対しては再生成せずキャッシュを返す（Day36でDB永続化）。
export class AiAreaReport {
  private constructor(private readonly props: AiAreaReportProps) {}

  static create(props: AiAreaReportProps): AiAreaReport {
    return new AiAreaReport(props);
  }

  get areaCode(): string {
    return this.props.areaCode;
  }

  get period(): string {
    return this.props.period;
  }

  get content(): string {
    return this.props.content;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }
}
