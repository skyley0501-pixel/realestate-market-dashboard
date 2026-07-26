# REMDA（RealEstateMarketDAshboard）

**REMDA**は、東京都・神奈川県・千葉県・埼玉県を対象に、国土交通省「不動産情報ライブラリ」のデータを用いて不動産市場を分析するダッシュボード（首都圏不動産マーケットダッシュボード）。転職活動用ポートフォリオとして開発中。

## 🎉 Phase1 Completed（Day1〜18）

- ✅ Vercel公開完了（[公開URL](https://realestate-market-dashboard.vercel.app/)）
- ✅ SSR一覧・詳細・検索実装
- ✅ 国交省API取り込み基盤完成
- ✅ Clean Architecture × DDD基盤完成

🚀 次は分析機能・AI活用（Phase2）

- 公開URL: https://realestate-market-dashboard.vercel.app/（現時点では実データ未投入のため一覧は空の状態）
- 要件定義: [`docs/requirements.md`](./docs/requirements.md)
- 設計書: [`docs/design.md`](./docs/design.md)
- 実装ロードマップ: [`docs/roadmap.md`](./docs/roadmap.md)
- 設計判断の記録（ADR）: [`docs/adr/`](./docs/adr/)

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
| `npm test` | 単体テスト（Vitest、DB非依存） | 全テストが通る |
| `npm run test:integration` | 結合テスト（Vitest、実際のSupabaseに接続） | 全テストが通る（`.env`の`DATABASE_URL`/`DIRECT_URL`が必要） |
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

## データ取得スクリプト（不動産情報ライブラリAPI）

[不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/) の不動産価格情報取得API（XIT001）から取引データを取得し、`data/reinfolib/`（gitignore対象）にJSONとして保存する。

```bash
# APIキー無しでURL・対象四半期の組み立てのみ確認する
node scripts/fetch-reinfolib.ts --area 13 --quarters 4 --dry-run

# 実データ取得（.env に REINFOLIB_API_KEY が必要）
npm run fetch:reinfolib -- --area 13 --quarters 4
```

- `--area`: 都道府県コード（例: 東京都=13、デフォルトは13）
- `--quarters`: 直近何四半期分を取得するか（デフォルト4、進行中の四半期は含めない）
- `--out-dir`: 保存先ディレクトリ（デフォルト `data/reinfolib`）
- APIキーは[APIマニュアル](https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/)から利用申請し、`.env` の `REINFOLIB_API_KEY` に設定する（`.env.example` にキー名のコメント記載済み。値は各自のローカル環境で設定する）
- APIレスポンスに最寄駅情報は含まれないため、`Transaction.stationId` 等は別途の駅名寄せ処理まではこのスクリプトの対象外

## シードデータ投入

取得したJSON（`data/reinfolib/*.json`）をクレンジングし、`Prefecture`/`Municipality`をupsertした上で`Transaction`へ投入する。

```bash
npm run db:seed
```

- 変換ロジック（価格・面積・築年数・取引時期の正規化）は `prisma/lib/reinfolib-transform.ts` に純粋関数として実装し、`npm test` でAPIキー無しでも検証できる
- `data/reinfolib/` にJSONが無い場合は何もせずメッセージを表示して終了する（DBへの書き込みは行わない）
- 都道府県コードはAPIレスポンスに含まれないため、市区町村コード（JIS X0402）の先頭2桁から導出している

## API

### `GET /api/transactions`

取引検索。クエリパラメータは全て任意。

| パラメータ | 型 | 説明 |
|---|---|---|
| `municipalityCode` | string | 市区町村コード |
| `propertyType` | string | 取引の種類（例: 中古マンション等） |
| `floorPlan` | string | 間取り |
| `minPrice` / `maxPrice` | number（円） | 価格帯 |
| `limit` | number（1〜100） | 取得件数上限 |
| `offset` | number | オフセット |

```bash
npm run dev
curl "http://localhost:3000/api/transactions?municipalityCode=13113&limit=10"
# => {"data":[...]}
curl "http://localhost:3000/api/transactions?limit=abc"
# => 400 {"error":{"code":"VALIDATION_ERROR",...}}
```

エラーレスポンスは共通形式 `{ "error": { "code", "message", "requestId" } }` で返す（`src/shared/infrastructure/http/handle-route-error.ts`）。

### `GET /api/transactions/:id`

取引詳細。存在しないIDの場合は404（`TRANSACTION_NOT_FOUND`）を返す。

```bash
curl "http://localhost:3000/api/transactions/<id>"
# => 200 {"data":{...}}  / 存在しないIDなら 404 {"error":{"code":"TRANSACTION_NOT_FOUND",...}}
```

## ページ

### `/transactions`

取引一覧ページ（Server Component、SSR）。1ページ20件、`?page=N`でページネーション（総件数取得を避けるため`limit+1`件取得し、超過分の有無で「次へ」の活性/非活性を判定）。

`TransactionFilterPanel`（Client Component、React Hook Form + Zod）で市区町村コード/種類/間取り/価格帯を絞り込み可能。フィルタ変更は`router.push`でURL query paramsに反映され（例: `?municipalityCode=13113&minPrice=50000000`）、SSR側がそれを読んで再検索する。ページ送りリンクも現在のフィルタ条件を維持する。「リセット」で条件をクリアし`/transactions`に戻る。

```bash
npm run dev
# ブラウザで http://localhost:3000/transactions を開く
```

### `/transactions/:id`

取引詳細ページ（Server Component、SSR）。存在しないIDは`notFound()`でNext.js標準の404ページを表示する。「一覧に戻る」はURL固定リンクではなく`router.back()`（Client Component）を使い、一覧側の検索条件・ページ位置を維持する。

### `/`（トップページ）

対象地域・使用データ・主な機能（取引検索/エリア分析/AI活用、Phase2・3は「準備中」表示）・開発の問題意識を掲載し、「取引を検索する」で`/transactions`へ、「About」で`/about`へ遷移できる。

### `/about`

開発の背景・問題意識、アーキテクチャ方針（Clean Architecture × Feature First × DDD）、技術スタックを掲載。開発の問題意識は現時点ではプレースホルダー（`[ここに開発動機・問題意識を記入]`）のため、後日実際の内容に差し替える。

## デプロイ（Vercel）

GitHubリポジトリ（`main`ブランチ）と連携し、pushごとに自動デプロイされる。Framework Preset・Build Commandはデフォルト（`next build`）のまま。

環境変数（Project Settings > Environment Variables）:

| 変数名 | 必須 | 備考 |
|---|---|---|
| `DATABASE_URL` | 必須 | SupabaseのTransaction pooler接続文字列。アプリの実行時に使用 |
| `DIRECT_URL` | 任意 | SupabaseのSession pooler接続文字列。現状Vercel上のビルド/実行では未使用だが、将来`prisma migrate deploy`をVercel上で実行する場合に備えて設定 |
| `REINFOLIB_API_KEY` | 任意 | アプリの実行時には使用しない（`scripts/fetch-reinfolib.ts`等ローカル実行のスクリプト専用） |

`npm install`だけでは`src/generated/prisma`（gitignore対象）が生成されずビルドが失敗するため、`package.json`の`postinstall`で`prisma generate`を実行するようにしてある。

Vercelは[Hobbyプラン（無料）](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)を利用。Hobbyは非商用個人利用限定のため、決済・広告・有償コンテンツの販売宣伝等をサイトに追加する場合はProプランへの切り替えを検討する。

## ディレクトリ構成（現時点）

```
src/app/                 # Next.js App Router（ページ・レイアウト）
src/components/ui/       # shadcn/ui コンポーネント
src/components/layout/   # ヘッダー・フッターなど全ページ共通のレイアウト
src/lib/                 # 汎用ユーティリティ（cn 等）
src/shared/domain/                       # 共有ドメイン基盤（Money, DomainError等の値オブジェクト・エラー）
src/shared/application/                  # 共有アプリケーション層基盤（Result型, ApplicationError）
src/shared/infrastructure/prisma/        # PrismaClientシングルトン（driver adapter経由でSupabaseに接続）
src/shared/infrastructure/http/          # requestId発行・共通エラーハンドラ（handleRouteError）
src/app/transactions/                    # 取引一覧ページ・取引詳細ページ（[id]）
src/features/transaction/domain/         # transaction機能のドメイン層（Entity・VO・Repository interface）
src/features/transaction/application/    # transaction機能のアプリケーション層（UseCase）
src/features/transaction/infrastructure/ # transaction機能のインフラ層（PrismaRepository実装・DIコンテナ）
src/features/transaction/presentation/   # transaction機能のプレゼンテーション層（Zodスキーマ・DTOマッパー・TransactionTable等）
src/app/api/transactions/                # 取引検索API（GET /api/transactions）
src/generated/prisma/                    # Prisma Client生成コード（gitignore対象、db:generateで生成）
prisma/schema.prisma     # DBスキーマ定義
scripts/                 # データ取得等のシード用スクリプト（Next.jsのビルド対象外）
data/                    # スクリプトが取得した生データ（gitignore対象）
docs/                    # 要件定義・設計・ロードマップ
```

`src/features/{context}`はFeature First × Clean Architectureで、機能ごとに`domain/application/infrastructure/presentation`の4層を持つ。詳細は [`docs/design.md`](./docs/design.md) を参照。
