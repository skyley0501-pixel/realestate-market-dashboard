export type RateNewsSource = "boj" | "frb";

export interface RateNewsProps {
  source: RateNewsSource;
  title: string;
  url: string;
  publishedAt: Date;
}

// 金融政策の一次情報源（日銀・FRB）から取得した見出し1件を表すEntity。
// 本文は保持しない（著作権配慮のため転載しない）。同一性はurlで判定する。
export class RateNews {
  private constructor(private readonly props: RateNewsProps) {}

  static create(props: RateNewsProps): RateNews {
    return new RateNews(props);
  }

  get source(): RateNewsSource {
    return this.props.source;
  }

  get title(): string {
    return this.props.title;
  }

  get url(): string {
    return this.props.url;
  }

  get publishedAt(): Date {
    return this.props.publishedAt;
  }
}
