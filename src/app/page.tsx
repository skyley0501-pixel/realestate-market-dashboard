import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketContainer } from "@/features/market/infrastructure/container";
import { StatCard } from "@/features/market/presentation/components/StatCard";
import { formatTrendText, formatTsuboPrice, formatYen, trendColorClass } from "@/features/market/presentation/lib/format";
import { ArrowRight, BarChart3, Map, MessageCircle, Search, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const TARGET_AREAS = ["東京都", "神奈川県", "千葉県", "埼玉県"];

const FEATURES = [
  {
    title: "取引を探す",
    description: "市区町村・物件種別・間取り・価格帯から、国土交通省の実取引データを検索します。自然文入力にも対応。",
    href: "/transactions",
    icon: Search,
  },
  {
    title: "市場を比べる",
    description: "市区町村ごとの価格推移、坪単価ランキング、複数エリア比較を確認します。",
    href: "/areas",
    icon: BarChart3,
  },
  {
    title: "地図で見る",
    description: "ズームに応じて都道府県・市区町村へ切り替わる坪単価ヒートマップです。",
    href: "/map",
    icon: Map,
  },
  {
    title: "AIに聞く",
    description: "エリアの相場について、実際の統計データを踏まえてAIチャットが回答します。",
    href: "/ai/chat",
    icon: MessageCircle,
  },
  {
    title: "AIで予測する",
    description: "エリア・面積・築年数から、統計モデルが取引価格を参考推定します。",
    href: "/ai/predict",
    icon: Sparkles,
  },
] as const;

// ヒーロー背景の装飾用スパークライン。実データではなく「価格推移を読むダッシュボード」を
// 視覚的に示すための飾りなので、固定パスで軽量に済ませる（Chart.js等はロードしない）。
function HeroSparkline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 100"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-primary/25"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,70 30,62 60,68 90,45 120,50 150,30 180,38 210,20 240,26 270,10 300,16"
      />
    </svg>
  );
}

export default async function Home() {
  const summaryResult = await marketContainer.getDashboardSummaryUseCase().execute();

  return (
    <div className="relative">
      {/* ページ全体の固定背景。ヒーローカード等の不透明な枠には隠れ、余白・他セクションの背景にのみ透けて見える */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <Image
          src="/images/tokyo-night-skyline.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover object-center translate-x-[45%] sm:translate-x-[15%] lg:translate-x-[-15%]"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-10 sm:px-10 sm:py-14">
          <HeroSparkline />
          <div className="relative grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Phase 4 完了</Badge>
                <span className="text-sm text-muted-foreground">国土交通省の実取引データ + AI分析</span>
              </div>
              <p className="mt-8 font-mono text-sm tracking-widest text-muted-foreground">
                REMDA / REAL ESTATE MARKET DATA
              </p>
              <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
                首都圏の不動産市場を、
                <br className="hidden sm:inline" />
                データとAIで読む。
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                {TARGET_AREAS.join("・")}を対象に、取引検索・統計比較・地図・AI講評/チャット/価格予測までを一つにまとめた市場分析ダッシュボードです。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button render={<Link href="/dashboard" />}>
                  ダッシュボードを見る <ArrowRight />
                </Button>
                <Button variant="outline" render={<Link href="/about" />}>
                  設計と開発背景
                </Button>
              </div>
            </div>

            {summaryResult.match(
              (summary) => (
                <div className="grid grid-cols-[3fr_2fr] gap-3">
                  <StatCard label="対象エリア数" value={`${summary.areaCount}エリア`} />
                  <StatCard label="取引総数" value={`${summary.totalTransactionCount}件`} />
                  <StatCard label="平均坪単価" value={formatTsuboPrice(summary.avgUnitPriceYenPerSqm)} />
                  <StatCard
                    label="平均前期比"
                    value={formatTrendText(summary.avgTrendRatePercent)}
                    valueClassName={trendColorClass(summary.avgTrendRatePercent)}
                  />
                  <div className="col-span-2">
                    <StatCard label="平均中央値" value={formatYen(summary.avgMedianPriceYen)} />
                  </div>
                </div>
              ),
              () => null,
            )}
          </div>
        </section>

        <section className="py-12" aria-labelledby="features-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-widest text-muted-foreground">ANALYSIS WORKFLOW</p>
              <h2 id="features-heading" className="mt-2 text-2xl font-semibold">
                データを見る5つの入口
              </h2>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">Phase 1–4 / Day 1–52</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardHeader>
                      <Icon className="size-5 text-primary" aria-hidden="true" />
                      <CardTitle className="mt-4 text-base">{feature.title}</CardTitle>
                      <CardDescription className="leading-6">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 border-t pt-10 sm:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-xs tracking-widest text-muted-foreground">ENGINEERING</p>
            <h2 className="mt-2 text-xl font-semibold">分析とAIを支える設計</h2>
          </div>
          <p className="leading-7 text-muted-foreground">
            Clean ArchitectureとDDDを軽量に適用し、統計計算・LLM呼び出しをUIやDBから分離しています。IQR法による外れ値除去、事前集計、型安全なエラー処理、LLM出力の検証をテストで確認し、実データとAIを組み合わせる際の再現性と保守性を重視しました。
          </p>
        </section>

        <section className="border-t pt-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span>Phase 4: UI改善 完了 / 次はPhase 5: リリース（認証・個人化機能）</span>
          </div>
        </section>
      </div>
    </div>
  );
}
