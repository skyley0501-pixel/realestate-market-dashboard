import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const TECH_STACK_GROUPS = [
  { category: "フロントエンド", items: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS", "shadcn/ui"] },
  { category: "データ可視化", items: ["MapLibre GL", "Chart.js", "GeoJSON"] },
  { category: "バックエンド", items: ["Route Handlers", "Supabase (PostgreSQL)", "Prisma 7", "Zod"] },
  { category: "品質・運用", items: ["Vitest", "ESLint", "GitHub Actions", "Vercel"] },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <p className="font-mono text-sm tracking-widest text-muted-foreground">ABOUT REMDA</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">実取引データを、意思決定できる情報へ。</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
        REMDAは、散在する不動産取引情報を検索・比較・可視化し、エリアごとの市場傾向を読み取りやすくするために開発したポートフォリオです。
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>開発の背景</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>国土交通省の不動産情報ライブラリには有用な実取引データがありますが、個別取引だけでは地域の相場や変化を把握しにくいという課題があります。</p>
            <p>そこで、市区町村×四半期で統計を事前集計し、ランキング・時系列・比較チャート・地図を同じデータモデルから提供する構成にしました。</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>設計で重視したこと</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>価格・坪単価・統計量を値オブジェクトとして表現し、IQR法による外れ値除去などの市場分析ロジックをドメイン層に閉じ込めています。</p>
            <p>UseCaseはResult型で成功・失敗を表し、Repository interfaceを介してPrismaへの依存を分離。単体テストと実DB結合テストを使い分けています。</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>技術スタック</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {TECH_STACK_GROUPS.map((group) => (
            <div key={group.category}>
              <h2 className="text-sm font-semibold">{group.category}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/dashboard" />}>ダッシュボードを見る</Button>
        <Button variant="outline" render={<a href="https://github.com/skyley0501-pixel/realestate-market-dashboard/blob/main/docs/design.md" target="_blank" rel="noopener noreferrer" />}>設計書を見る</Button>
      </div>
    </div>
  );
}
