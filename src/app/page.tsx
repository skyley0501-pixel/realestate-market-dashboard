import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Map, Search } from "lucide-react";
import Link from "next/link";

const TARGET_AREAS = ["東京都", "神奈川県", "千葉県", "埼玉県"];

const FEATURES = [
  {
    title: "取引を探す",
    description: "市区町村・物件種別・間取り・価格帯から、国土交通省の実取引データを検索します。",
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
] as const;

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <section className="border-b pb-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Phase 2 完了</Badge>
          <span className="text-sm text-muted-foreground">国土交通省の実取引データを使用</span>
        </div>
        <p className="mt-8 font-mono text-sm tracking-widest text-muted-foreground">REMDA / REAL ESTATE MARKET DATA</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          首都圏の不動産市場を、
          <br />
          取引/統計/地図から読む。
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {TARGET_AREAS.join("・")}を対象に、取引検索から市区町村別の価格推移、比較、ヒートマップまでを一つにまとめた市場分析ダッシュボードです。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard" />}>
            ダッシュボードを見る <ArrowRight />
          </Button>
          <Button variant="outline" render={<Link href="/about" />}>設計と開発背景</Button>
        </div>
      </section>

      <section className="py-12" aria-labelledby="features-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-muted-foreground">ANALYSIS WORKFLOW</p>
            <h2 id="features-heading" className="mt-2 text-2xl font-semibold">データを見る3つの入口</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">Phase 2 / Day 19–32</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full transition-colors group-hover:border-foreground/40">
                  <CardHeader>
                    <Icon className="size-5" aria-hidden="true" />
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
          <h2 className="mt-2 text-xl font-semibold">分析機能を支える設計</h2>
        </div>
        <p className="leading-7 text-muted-foreground">
          Clean ArchitectureとDDDを軽量に適用し、統計計算をUIやDBから分離しています。IQR法による外れ値除去、事前集計、型安全なエラー処理をテストで検証し、実データを扱う際の再現性と保守性を重視しました。
        </p>
      </section>
    </div>
  );
}
