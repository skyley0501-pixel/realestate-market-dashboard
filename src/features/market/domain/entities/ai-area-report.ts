export interface AiAreaReportProps {
  areaCode: string;
  content: string;
  generatedAt: Date;
}

// エリアの市況をAIが要約した講評文。同一エリア・同一期間の集計に対しては再生成せずキャッシュを返す運用を想定（Day36でDB永続化）。
export class AiAreaReport {
  private constructor(private readonly props: AiAreaReportProps) {}

  static create(props: AiAreaReportProps): AiAreaReport {
    return new AiAreaReport(props);
  }

  get areaCode(): string {
    return this.props.areaCode;
  }

  get content(): string {
    return this.props.content;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }
}
