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

const ARCHITECTURE_LAYERS = [
  {
    id: "presentation",
    label: "Presentation",
    detail: "Next.js Page / Component",
    x: 24,
    y: 24,
    fillClass: "fill-chart-1/15",
    strokeClass: "stroke-chart-1",
    textClass: "fill-chart-1",
  },
  {
    id: "application",
    label: "Application",
    detail: "UseCase / Result<T,E>",
    x: 244,
    y: 24,
    fillClass: "fill-chart-2/15",
    strokeClass: "stroke-chart-2",
    textClass: "fill-chart-2",
  },
  {
    id: "domain",
    label: "Domain",
    detail: "Entity / VO / Repository I/F",
    x: 464,
    y: 24,
    fillClass: "fill-primary/15",
    strokeClass: "stroke-primary",
    textClass: "fill-primary",
  },
] as const;

// Clean Architecture × Feature Firstの依存の向きを示す図。
// Presentation→Application→Domainは通常の実行依存（実線）、
// InfrastructureはDomainが定義したRepository interfaceを実装する依存性逆転（破線）で区別する。
function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 664 260"
      role="img"
      aria-label="Presentation層からApplication層を経てDomain層へ依存する構成。Infrastructure層はDomain層のRepositoryインターフェースを実装する形で依存性が逆転している。"
      className="h-auto w-full text-muted-foreground"
    >
      {ARCHITECTURE_LAYERS.map((layer) => (
        <g key={layer.id}>
          <rect
            x={layer.x}
            y={layer.y}
            width={196}
            height={88}
            rx={14}
            className={`${layer.fillClass} ${layer.strokeClass}`}
            strokeWidth={1.5}
          />
          <text x={layer.x + 20} y={layer.y + 36} className={`${layer.textClass} text-base font-semibold`}>
            {layer.label}
          </text>
          <text x={layer.x + 20} y={layer.y + 60} className="fill-current text-xs">
            {layer.detail}
          </text>
        </g>
      ))}

      {/* Presentation → Application → Domain（実線・実行依存） */}
      <path d="M224 68 H240" stroke="currentColor" strokeWidth={2} markerEnd="url(#arrow)" />
      <path d="M444 68 H460" stroke="currentColor" strokeWidth={2} markerEnd="url(#arrow)" />

      {/* Infrastructure（下段） */}
      <rect x={244} y={172} width={216} height={76} rx={14} className="fill-chart-3/15 stroke-chart-3" strokeWidth={1.5} />
      <text x={260} y={202} className="fill-chart-3 text-base font-semibold">
        Infrastructure
      </text>
      <text x={260} y={222} className="fill-current text-xs">
        <tspan x={260} dy={0}>
          Repository実装 / Prisma
        </tspan>
        <tspan x={260} dy={16}>
          外部API
        </tspan>
      </text>

      {/* Infrastructure → Domain（破線・Repository interfaceの実装で依存性逆転） */}
      <path
        d="M440 172 C 470 140, 520 100, 562 112"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        markerEnd="url(#arrow-dashed)"
      />
      <text x={430} y={158} className="fill-current text-[10px]">
        Repository interfaceを実装
      </text>

      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
        <marker id="arrow-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

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
        <CardHeader>
          <CardTitle>アーキテクチャ</CardTitle>
        </CardHeader>
        <CardContent>
          <ArchitectureDiagram />
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            featureごとにPresentation・Application・Domain・Infrastructureの4層に分割しています。UIから見るとPresentation→Application→Domainの順に依存し、最も内側のDomain層は外部技術（DB・LLM API）を一切知りません。DomainがRepositoryのインターフェースを定義し、Infrastructure層がPrisma等でそれを実装することで依存の向きを逆転させ、DB実装を差し替えてもDomain・Applicationのロジックやテストに影響が出ない構成にしています。
          </p>
        </CardContent>
      </Card>

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
