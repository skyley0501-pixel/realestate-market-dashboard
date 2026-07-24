import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const REPOSITORY_URL =
  "https://github.com/skyley0501-pixel/realestate-market-dashboard";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Badge variant="secondary">開発中</Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        首都圏不動産マーケットダッシュボード
      </h1>
      <p className="mt-3 text-muted-foreground">
        東京都・神奈川県・千葉県・埼玉県を対象に、国土交通省「不動産情報ライブラリ」のデータを用いて
        不動産市場を分析するダッシュボードです。検索・統計分析・AI活用機能を順次公開していきます。
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>開発状況</CardTitle>
          <CardDescription>
            小さな単位で実装し、GitHub上で公開しながら開発を進めています。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            GitHubリポジトリを見る（新しいタブで開きます）
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
