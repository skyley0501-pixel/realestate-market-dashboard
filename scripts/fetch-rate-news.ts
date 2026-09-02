// 日銀・FRBの公式RSSから金融政策関連の見出しを取得し、RateNewsテーブルへ保存するバッチスクリプト。
// 実行例: npm run fetch:rate-news
//
// 本文は取得・保存しない（著作権配慮のため、見出し・リンク・日付のみを扱う）。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { XMLParser } from "fast-xml-parser";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const parser = new XMLParser({ processEntities: true, htmlEntities: true });

const BOJ_RSS_URL = "https://www.boj.or.jp/rss/whatsnew.xml";
const FRB_RSS_URL = "https://www.federalreserve.gov/feeds/press_monetary.xml";

// 日銀の新着情報RSSは統計データの公表通知等ノイズが多いため、金融政策関連のタイトルのみ抽出する
const BOJ_KEYWORD_PATTERN = /金融政策決定会合|金融政策運営|政策金利/;

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
}

interface RateNewsRecord {
  title: string;
  url: string;
  publishedAt: Date;
}

function parseRssItems(xml: string): RssItem[] {
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  const items = parsed.rss?.channel?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function toRecords(items: RssItem[]): RateNewsRecord[] {
  return items
    .map((item) => ({
      title: String(item.title ?? "").trim(),
      url: String(item.link ?? "").trim(),
      publishedAt: new Date(String(item.pubDate ?? "")),
    }))
    .filter((record) => record.title !== "" && record.url !== "" && !Number.isNaN(record.publishedAt.getTime()));
}

async function fetchRssItems(url: string, label: string): Promise<RssItem[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label}のRSS取得に失敗しました: HTTP ${res.status}`);
  return parseRssItems(await res.text());
}

async function main() {
  const [bojItems, frbItems] = await Promise.all([
    fetchRssItems(BOJ_RSS_URL, "日本銀行"),
    fetchRssItems(FRB_RSS_URL, "FRB"),
  ]);

  const bojNews = toRecords(bojItems).filter((record) => BOJ_KEYWORD_PATTERN.test(record.title));
  const frbNews = toRecords(frbItems);

  console.log(`取得件数: 日本銀行${bojNews.length}件（金融政策関連に絞り込み） / FRB${frbNews.length}件`);

  const allNews = [
    ...bojNews.map((record) => ({ ...record, source: "boj" as const })),
    ...frbNews.map((record) => ({ ...record, source: "frb" as const })),
  ];

  for (const record of allNews) {
    await prisma.rateNews.upsert({
      where: { url: record.url },
      create: record,
      update: { title: record.title, publishedAt: record.publishedAt },
    });
  }

  console.log("完了");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
