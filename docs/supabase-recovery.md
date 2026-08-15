# Supabase無料プラン停止からの復旧手順

## なぜ起きるか

Supabase無料プランは**7日間アクセス（ログイン）がないとプロジェクトが自動停止（Pause）**される。長期間（目安90日以上）放置すると、単なる停止ではなく**プロジェクトが完全に削除され、次回作成時は別プロジェクト（project refが変わる）として扱われる**ことがある。この場合、旧project refの接続情報は二度と使えず、新規プロジェクト相当の対応（DBパスワード再発行・スキーマ再作成・データ再投入）が必要になる。

**症状**: サイトを開くと「ダッシュボードサマリーの取得に失敗しました」等、DB系のエラーメッセージだけが表示される（詳細な原因は画面に出ない設計のため、以下の手順で切り分ける）。

## 復旧手順

### 1. 状況を切り分ける（原因特定）

```bash
cd "C:\Users\piech\Projects\realestate-market-dashboard"
```

以下の内容で `scripts/tmp-test-db.ts` を作成し、直接DB疎通確認する（完了後は必ず削除する）。

```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const result = await prisma.areaStatistics.aggregate({ _max: { period: true } });
    console.log("OK:", result);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
main();
```

```bash
npx tsx scripts/tmp-test-db.ts
```

エラーメッセージで症状を切り分ける。

| エラーメッセージ | 原因 | 対応 |
|---|---|---|
| `(ENOTFOUND) tenant/user ... not found` | project refが無効（削除/変更された） | 手順2へ |
| `Authentication failed ... credentials for postgres are not valid` | パスワードが違う | 手順3へ |
| `Invalid URL` | パスワードに`/` `@`等の特殊文字が入っていてURLが壊れている | 手順4へ |
| `The table "public.xxx" does not exist` | DBは空（スキーマ未作成） | 手順5へ |

### 2. Supabaseプロジェクトの状態を確認

1. https://supabase.com/dashboard にログイン
2. 対象プロジェクトが「Paused」表示なら「Resume」で再開
3. プロジェクトが見当たらない・別IDになっている場合は、削除→再作成が起きている。新しいproject refを確認し、`.env`の`DATABASE_URL`/`DIRECT_URL`のproject ref部分（`postgres.xxxxx`の`xxxxx`）を差し替える

### 3. DBパスワードを更新

Supabaseダッシュボード → 対象プロジェクト → Settings → Database → Connection string（または Reset database password で新規発行）で新しいパスワードを取得し、`.env`の該当2行に反映する。

### 4. パスワードをURLエンコードする（特殊文字が含まれる場合）

パスワードに `/` `@` `:` `#` `?` などが含まれると接続文字列（URL形式）のパースが壊れる。以下でエンコードしてから`.env`に反映する。

```bash
node -e "console.log(encodeURIComponent('ここに新パスワード'))"
```

`.env`のイメージ:

```
DATABASE_URL="postgresql://postgres.<project-ref>:<encodedパスワード>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.<project-ref>:<encodedパスワード>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 5. スキーマとデータを復元（新規プロジェクトで空の場合のみ）

```bash
npx prisma migrate deploy
npm run db:seed
npm run db:aggregate
```

- `db:seed`は`data/reinfolib/*.json`にある既存の生データを読み込む（ローカルに残っていれば外部APIの再取得は不要）
- 生データが無い場合のみ `npm run fetch:reinfolib`（`REINFOLIB_API_KEY`が必要）を先に実行する

### 6. 開発サーバーを再起動して確認

`.env`変更はNext.jsの実行中プロセスに反映されないため、必ずサーバーを再起動する。

```bash
# 既存プロセスを止めてから
npm run dev
```

`http://localhost:3000/dashboard` を開き、サマリー4項目が表示されればローカルは復旧完了。

### 7. Vercel（本番）側も忘れずに更新する

**ローカルの`.env`を直しても本番Vercelには反映されない。** Vercel側は別途保存された環境変数を使っている。

1. https://vercel.com/skyley/realestate-market-dashboard/settings/environment-variables を開く
2. 「データベースURL」（DATABASE_URL）を編集し、手順3・4で確定した最新の接続文字列に貼り替える
3. Deploymentsタブから最新デプロイを「Redeploy」（環境変数変更は再デプロイしないと反映されない）
4. 本番URL（`https://realestate-market-dashboard.vercel.app/dashboard`）を開いて確認

※ `prisma/schema.prisma`の`datasource`には`directUrl`の指定が無いため、Vercel側は`DATABASE_URL`のみで動作する（`DIRECT_URL`はローカルでのマイグレーション実行時にのみ使用）。

## 再発防止（できれば検討）

- 週1回程度、Supabaseダッシュボードにログインするだけでも自動停止は回避できる（無料プランの制約を許容し続けるなら運用でカバー）
- 有料プラン（Pro以上）に上げれば自動停止自体が発生しない
- `data/reinfolib/*.json`の生データはバックアップとして貴重（DB全消失時の再構築の生命線）なので、誤って削除しないよう`.gitignore`の除外対象になっていないか等、保管場所は定期的に確認する
