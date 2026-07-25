# 首都圏不動産マーケットダッシュボード

東京都・神奈川県・千葉県・埼玉県を対象に、国土交通省「不動産情報ライブラリ」のデータを用いて不動産市場を分析するダッシュボード。転職活動用ポートフォリオとして開発中。

- 要件定義: [`docs/requirements.md`](./docs/requirements.md)
- 設計書: [`docs/design.md`](./docs/design.md)
- 実装ロードマップ: [`docs/roadmap.md`](./docs/roadmap.md)

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / shadcn/ui / Supabase (PostgreSQL) / Prisma / MapLibre GL / Chart.js / React Query / Zod / React Hook Form / OpenAI API or Claude API / Vercel / GitHub Actions

## セットアップ

```bash
npm install
cp .env.example .env
# .env に Supabase の接続文字列（DATABASE_URL / DIRECT_URL）を設定する
```

`DATABASE_URL` / `DIRECT_URL` は Supabaseダッシュボード の Project Settings > Database > Connect から取得する（値は`.env.example`のコメント参照）。`.env`はgitignore対象のため、各自のローカル環境で設定する。

## 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開き、トップページが表示されることを確認する。

## 動作確認

| コマンド | 内容 | 期待される結果 |
|---|---|---|
| `npm run dev` | 開発サーバー起動 | `http://localhost:3000` にヘッダー・フッター付きのトップページが表示される |
| `npm run build` | 本番ビルド | エラーなくビルドが完了する |
| `npm run lint` | ESLint実行 | `0 problems` で終了する |
| `npm run typecheck` | TypeScript型チェック | エラーなく終了する |
| `npm run db:pull` | Supabaseへの接続確認（introspection） | エラーなく接続でき、テーブルがあれば `schema.prisma` に反映される |

### エラー時の対処

- `npm run dev` 後にブラウザで真っ白/404になる場合: ターミナルのビルドログにエラーが出ていないか確認し、`.next` フォルダを削除して再起動する（`rm -rf .next && npm run dev`）。
- `npm run lint` でエラーが出た場合: メッセージに従い該当ファイルを修正する。`any` 型の使用は許可していないため、具体的な型または `unknown` + 型ガードに置き換える。
- `npm install` が失敗する場合: Node.js のバージョンを確認する（開発時は Node v24 系を使用）。
- shadcn/uiコンポーネントの追加でエラーになる場合: `npx shadcn@latest add <component名>` を実行し、`components.json` の設定（エイリアス `@/*`）が壊れていないか確認する。
- `npm run db:pull` がハングする、または応答がない場合: `.env` の `DIRECT_URL` がSupabaseの **Session pooler（ポート5432）** を指しているか確認する。**Transaction pooler（ポート6543）** はCLIのintrospection/migrateに対応していないため、`prisma.config.ts` はCLI操作に常に `DIRECT_URL` を使う設定にしてある。
- `P4001 The introspected database was empty` は接続自体は成功しており、テーブルが未作成なだけなので無視してよい（テーブル追加後に再実行する）。

## UIコンポーネント

[shadcn/ui](https://ui.shadcn.com/) を導入済み。コンポーネントは `src/components/ui/` に生成され、追加は以下のコマンドで行う。

```bash
npx shadcn@latest add <component名>
```

共通レイアウト（ヘッダー・フッター）は `src/components/layout/` に配置し、`src/app/layout.tsx` の `RootLayout` で全ページに適用している。

## データベース（Supabase / Prisma）

- `prisma/schema.prisma`: モデル定義（`Prefecture` / `Municipality` / `Station` の基礎マスタと `Transaction`（取引情報）を定義済み。`Municipality`・`Station` は `Transaction` と1:Nで関連）
- `prisma.config.ts`: PrismaのCLI（migrate/db pull等）が使う接続先を設定。SupabaseのTransaction pooler（6543）はCLIのintrospection/migrateに対応しないため、CLI操作は常に`DIRECT_URL`（Session pooler, 5432）を使う
- アプリケーション実行時（Route Handler等）のPrisma Clientは、Prisma 7の仕様変更により `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })` のようにドライバアダプタを明示して生成する必要がある（`@prisma/adapter-pg` は機能実装時に追加予定）。この接続はTransaction pooler（`DATABASE_URL`）を使う

コマンド:

```bash
npm run db:pull      # Supabaseの現在のスキーマをschema.prismaに反映（接続確認にも使用）
npm run db:generate  # Prisma Clientを生成（src/generated/prisma、gitignore対象）
```

## ディレクトリ構成（現時点）

```
src/app/                 # Next.js App Router（ページ・レイアウト）
src/components/ui/       # shadcn/ui コンポーネント
src/components/layout/   # ヘッダー・フッターなど全ページ共通のレイアウト
src/lib/                 # 汎用ユーティリティ（cn 等）
src/generated/prisma/    # Prisma Client生成コード（gitignore対象、db:generateで生成）
prisma/schema.prisma     # DBスキーマ定義
docs/                    # 要件定義・設計・ロードマップ
```

機能追加に伴い `src/features/`（Feature First × Clean Architecture）を追加していく。詳細は [`docs/design.md`](./docs/design.md) を参照。
