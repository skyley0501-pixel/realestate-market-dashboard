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
```

環境変数は現時点で未使用（Supabase接続を追加するタイミングで `.env.example` を追加する）。

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

### エラー時の対処

- `npm run dev` 後にブラウザで真っ白/404になる場合: ターミナルのビルドログにエラーが出ていないか確認し、`.next` フォルダを削除して再起動する（`rm -rf .next && npm run dev`）。
- `npm run lint` でエラーが出た場合: メッセージに従い該当ファイルを修正する。`any` 型の使用は許可していないため、具体的な型または `unknown` + 型ガードに置き換える。
- `npm install` が失敗する場合: Node.js のバージョンを確認する（開発時は Node v24 系を使用）。
- shadcn/uiコンポーネントの追加でエラーになる場合: `npx shadcn@latest add <component名>` を実行し、`components.json` の設定（エイリアス `@/*`）が壊れていないか確認する。

## UIコンポーネント

[shadcn/ui](https://ui.shadcn.com/) を導入済み。コンポーネントは `src/components/ui/` に生成され、追加は以下のコマンドで行う。

```bash
npx shadcn@latest add <component名>
```

共通レイアウト（ヘッダー・フッター）は `src/components/layout/` に配置し、`src/app/layout.tsx` の `RootLayout` で全ページに適用している。

## ディレクトリ構成（現時点）

```
src/app/               # Next.js App Router（ページ・レイアウト）
src/components/ui/      # shadcn/ui コンポーネント
src/components/layout/  # ヘッダー・フッターなど全ページ共通のレイアウト
src/lib/                # 汎用ユーティリティ（cn 等）
docs/                   # 要件定義・設計・ロードマップ
```

機能追加に伴い `src/features/`（Feature First × Clean Architecture）を追加していく。詳細は [`docs/design.md`](./docs/design.md) を参照。
