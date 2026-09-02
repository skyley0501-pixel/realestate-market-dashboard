import { Badge } from "@/components/ui/badge";
import type { RateNewsDto } from "../mappers/interest-rate-trend.mapper";

const SOURCE_LABEL: Record<RateNewsDto["source"], string> = {
  boj: "日本銀行",
  frb: "FRB（米国）",
};

export interface RateNewsListProps {
  news: RateNewsDto[];
}

// 日銀・FRBの公式RSSから取得した見出しを一覧表示する。本文は保持していないため、
// リンク先（発表元の公式サイト）で全文を確認してもらう構成（著作権配慮）。
export function RateNewsList({ news }: RateNewsListProps) {
  if (news.length === 0) {
    return <p className="text-sm text-muted-foreground">ニュースがまだありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {news.map((item) => (
        <li key={item.url} className="flex items-start gap-3">
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {SOURCE_LABEL[item.source]}
          </Badge>
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm leading-6 hover:underline"
            >
              {item.title}
            </a>
            <p className="text-xs text-muted-foreground">{item.publishedAt}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
