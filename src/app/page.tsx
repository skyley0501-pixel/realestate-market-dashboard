import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const TARGET_AREAS = ["東京都", "神奈川県", "千葉県", "埼玉県"];

const FEATURES = [
  {
    title: "取引検索",
    status: "利用可能",
    description: "市区町村・種類・間取り・価格帯で不動産取引を検索し、詳細を確認できます。",
  },
  {
    title: "エリア分析",
    status: "準備中",
    description: "市区町村単位の坪単価ランキング・価格推移・地図ヒートマップ（Phase2で公開予定）。",
  },
  {
    title: "AI活用",
    status: "準備中",
    description: "自然言語検索・AIエリア講評・価格予測（Phase3で公開予定）。",
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Badge variant="secondary">開発中</Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        首都圏不動産マーケットダッシュボード
      </h1>
      <p className="mt-3 text-muted-foreground">
        {TARGET_AREAS.join("・")}を対象に、国土交通省「不動産情報ライブラリ」のデータを用いて
        不動産市場を分析するダッシュボードです。検索・統計分析・AI活用機能を順次公開していきます。
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button render={<Link href="/transactions" />}>取引を検索する</Button>
        <Button variant="outline" render={<Link href="/about" />}>
          About
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <Badge variant={feature.status === "利用可能" ? "default" : "secondary"}>
                  {feature.status}
                </Badge>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>開発の問題意識</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            [ここに開発動機・問題意識を記入]
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
