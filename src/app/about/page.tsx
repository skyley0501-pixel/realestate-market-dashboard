import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const TECH_STACK_GROUPS = [
  {
    category: "フロントエンド",
    items: ["Next.js (App Router)", "TypeScript", "Tailwind CSS", "shadcn/ui", "React Query"],
  },
  {
    category: "フォーム・バリデーション",
    items: ["React Hook Form", "Zod"],
  },
  {
    category: "データ・可視化",
    items: ["MapLibre GL", "Chart.js"],
  },
  {
    category: "バックエンド・データベース",
    items: ["Supabase (PostgreSQL)", "Prisma"],
  },
  {
    category: "AI",
    items: ["OpenAI API または Claude API"],
  },
  {
    category: "インフラ・CI/CD",
    items: ["Vercel", "GitHub Actions"],
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>開発の背景・問題意識</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            [ここに開発動機・問題意識を記入]
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>アーキテクチャ方針</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Clean Architecture × Feature First × DDD（軽量適用）を採用しています。UI・DB・外部APIといった変わりやすい部分からビジネスルールを独立させつつ、機能（feature）ごとにディレクトリを凝集させることで、機能追加時の認知負荷を下げています。詳細は
            {" "}
            <a
              href="https://github.com/skyley0501-pixel/realestate-market-dashboard/blob/main/docs/design.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              設計書
            </a>
            を参照してください。
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>技術スタック</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TECH_STACK_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold">{group.category}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button render={<Link href="/transactions" />}>取引を検索する</Button>
      </div>
    </div>
  );
}
