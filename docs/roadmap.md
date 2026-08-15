# REMDA（首都圏不動産マーケットダッシュボード） 実装ロードマップ

- 作成日: 2026-07-24
- バージョン: v0.1（初版）
- 前提ドキュメント: [`requirements.md`](./requirements.md) / [`design.md`](./design.md)
- 方針: **「毎日1コミット＝1タスク」を単位に分割**し、常に動く状態を保ちながら段階的に機能を積み上げる。各タスクは半日〜1日で完了できる粒度とし、大きすぎるタスクはサブタスクに分割してある。
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式（`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`）を使用する。

---

## Phase 1: MVP（最低限動くもの）

**ゴール**: 国交省データを取り込み、取引情報を検索・閲覧できる状態。デプロイ済みで誰でもアクセス可能。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 1 | プロジェクト初期化 | `create-next-app`（App Router, TypeScript, Tailwind）でリポジトリ作成、ESLint/Prettier設定、GitHubリポジトリ作成・初回push | `npm run dev`でデフォルトページが表示される | `chore: initialize Next.js project with TypeScript and Tailwind` |
| 2 | shadcn/ui導入 | `shadcn/ui`初期化、`Button`/`Card`/`Badge`等の基本コンポーネント追加、共通レイアウト（Header/Footer）作成 | 共通レイアウトが全ページに適用され、shadcnコンポーネントが表示できる | `feat: setup shadcn/ui and base layout` |
| 3 | Supabaseプロジェクト作成・Prisma接続 | Supabaseプロジェクト作成、Prisma初期化、`DATABASE_URL`を環境変数化、`.env.example`整備 | `npx prisma db pull`でSupabaseに接続確認できる | `chore: connect Prisma to Supabase project` |
| 4 | 基礎スキーマ定義（マスタ） | `prisma/schema.prisma`に`Prefecture`, `Municipality`, `Station`を定義しマイグレーション実行 | `npx prisma migrate dev`が成功し、テーブルがSupabase上に作成される | `feat: add prefecture/municipality/station schema` |
| 5 | 取引スキーマ定義 | `Transaction`テーブルを追加（価格・面積・築年数・間取り等）、インデックス設定 | マイグレーション成功、Prisma Studioでテーブル確認可能 | `feat: add transaction schema` |
| 6 | 国交省APIクライアント作成（シード用スクリプト） | `scripts/fetch-reinfolib.ts`で不動産情報ライブラリAPIから東京都1区分・直近数四半期のデータを取得しJSON保存 | スクリプト実行でJSONファイルが生成される | `feat: add script to fetch reinfolib transaction data` |
| 7 | シードデータ投入 | 取得JSONをクレンジング（表記ゆれ正規化・欠損除外）しPrisma seedスクリプトでDBへ投入 | `npx prisma db seed`でTransactionテーブルに実データが入る | `feat: add seed script for transaction data` |
| 8 | 共有ドメイン基盤 | `shared/domain`に`Money`, `DomainError`、`shared/application`に`Result`型を実装 | Vitestで`Money`の加算・丸め処理の単体テストが通る | `feat: add shared domain primitives (Money, Result, DomainError)` |
| 9 | transaction feature: domain層 | `Transaction` Entity、`FloorPlan`/`BuildingAge` Value Object、`TransactionRepository` interfaceを実装 | 型チェック通過、Entity生成のユニットテストが通る | `feat(transaction): add domain entities and repository interface` |
| 10 | transaction feature: application層 | `SearchTransactionsUseCase`, `GetTransactionDetailUseCase`を実装（Repositoryはモックでテスト） | UseCaseの単体テスト（正常系・0件時）が通る | `feat(transaction): add search and detail use cases` |
| 11 | transaction feature: infrastructure層 | `PrismaTransactionRepository`実装、`container.ts`でDI構成 | Repository経由でDBから実データが取得できることを結合テストで確認 | `feat(transaction): implement Prisma repository` |
| 12 | `/api/transactions` 実装 | Route Handler、Zodによるクエリバリデーション、共通エラーハンドラの初期実装 | `curl`で検索条件付きJSONレスポンスが返る | `feat(api): add GET /api/transactions endpoint` |
| 13 | `/api/transactions/[id]` 実装 | 詳細取得エンドポイント、404時のエラーレスポンス確認 | 存在するID→200、存在しないID→404が返る | `feat(api): add GET /api/transactions/:id endpoint` |
| 14 | 取引一覧ページ | `/transactions` Server Componentで初期一覧をSSR表示、`TransactionTable`実装 | ブラウザで一覧が表示され、ページネーションが動作する | `feat(transaction): add transaction list page` |
| 15 | 検索フィルタUI | `TransactionFilterPanel`（React Hook Form + Zod）、URL query paramsとの同期 | フィルタ変更でURLが更新され、結果が絞り込まれる | `feat(transaction): add filter form synced with URL params` |
| 16 | 取引詳細ページ | `/transactions/[id]`実装、`TransactionDetailCard`作成 | 一覧から詳細への遷移、詳細情報が表示される | `feat(transaction): add transaction detail page` |
| 17 | トップページ・About初版 | `/`（LP）、`/about`の静的コンテンツ作成（技術スタック紹介の骨子） | 主要導線からtransactions一覧へ遷移できる | `feat: add landing page and about page skeleton` |
| 18 | Vercel初回デプロイ | Vercelプロジェクト連携、環境変数設定、プレビューデプロイ確認 | 公開URLで一覧〜詳細まで一通り動作する | `chore: setup Vercel deployment` |

**Phase 1完了条件**: 実データに基づき取引検索〜詳細閲覧ができるアプリが本番URLで動作している。

---

## Phase 2: 分析機能

**ゴール**: エリア単位の統計・トレンド・比較・地図可視化により「市場を分析できる」ことを示す。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 19 | market feature: domain層（値オブジェクト） | `UnitPrice`, `PriceStatistics`（IQR外れ値除去込み）を実装 | 外れ値を含むテストデータで中央値・坪単価が正しく算出されるユニットテストが通る | `feat(market): add UnitPrice and PriceStatistics value objects` |
| 20 | market feature: 集約・ドメインサービス | `AreaMarketSnapshot`集約、`MarketStatisticsCalculator`（トレンド率計算含む）を実装 | 前年同期比の計算がテストで正しく検証される | `feat(market): add AreaMarketSnapshot and statistics calculator` |
| 21 | `AreaStatistics`テーブル追加 | スキーマ追加・マイグレーション、集計バッチスクリプト作成（市区町村×期間で事前集計） | バッチ実行でテーブルに集計結果が入る | `feat(market): add area_statistics table and aggregation script` |
| 22 | market feature: application/infrastructure層 | `ListAreasUseCase`, `GetAreaDetailUseCase`, `PrismaAreaRepository`実装 | 結合テストでエリア一覧・詳細が取得できる | `feat(market): add area use cases and repository` |
| 23 | `/api/areas`, `/api/areas/[code]` 実装 | Route Handler、キャッシュヘッダ設定 | JSONレスポンスにmedian/average/trendRateが含まれる | `feat(api): add area list and detail endpoints` |
| 24 | エリアランキングページ | `/areas`実装、`AreaRankingTable`（坪単価・上昇率・件数でソート） | 並べ替えが正しく動作する | `feat(market): add area ranking page` |
| 25 | Chart.js導入・価格推移グラフ | `react-chartjs-2`導入、`PriceTrendChart`（shared/ui）実装 | エリア詳細で四半期推移の折れ線グラフが表示される | `feat(ui): add PriceTrendChart with Chart.js` |
| 26 | エリア詳細ページ | `/areas/[code]`実装（統計サマリー＋価格推移＋間取り別分布） | 実データに基づくグラフ・数値が表示される | `feat(market): add area detail page` |
| 27 | トレンド分析ページ | `GetTrendsUseCase`, `/api/trends`, `/trends`ページ（複数エリア比較の折れ線） | 2エリア以上を選択して同一グラフで比較できる | `feat(market): add trend comparison page` |
| 28 | エリア比較機能 | `CompareAreasUseCase`, `/api/areas/compare`, `AreaComparisonView`（レーダーチャート） | クエリパラメータで指定した最大4エリアが比較表示される | `feat(market): add area comparison feature` |
| 29 | MapLibre GL導入・基本地図 | `MarketMap`（shared/ui）実装、エリア境界のポリゴン表示 | 地図上に1都3県の市区町村境界が描画される | `feat(ui): integrate MapLibre GL with municipality boundaries` |
| 30 | メッシュヒートマップ実装 | `/api/map/heatmap`、坪単価レンジによる色分けレイヤー | ズームレベルに応じて集計粒度が変化し色分け表示される | `feat(market): add price heatmap layer` |
| 31 | ダッシュボード統合 | `/dashboard`実装（地図＋主要統計＋トレンドサマリーを1画面に集約） | 主要指標と地図が1画面で確認できる | `feat: add market dashboard page` |
| 32 | 統計精度の検証・リファクタ | 外れ値除去ロジックのエッジケーステスト追加、パフォーマンス確認（大量データでのクエリ速度） | 主要ユースケースのテストカバレッジが分析系ロジックで一定水準に達する | `test(market): add edge case tests for statistics calculation` |

**Phase 2完了条件**: エリア分析（統計・トレンド・比較・地図）が実データで機能し、Phase 1の検索機能と連携している。

---

## Phase 3: AI機能

**ゴール**: LLMとMLを活用した機能により「AI活用」「データ分析力」を明確にアピールする。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 33 | LlmClient抽象化 | `LlmClient` interface定義、`GeminiLlmClient`実装（無料枠のFlashモデルを使用）、環境変数`AI_PROVIDER`によるcontainer切替（デフォルト`gemini`） | Gemini経由で単純なプロンプト応答がテストで確認できる | `feat(conversation): add LlmClient abstraction with Gemini adapter` |
| 34 | 将来プロバイダ差し替え用アダプタ整備 | `OpenAiLlmClient`/`ClaudeLlmClient`のスタブ実装（`AI_PROVIDER`切替の型のみ用意、実呼び出しは未実装として明示的にエラー）、README/ADRに切り替え方針を記録 | `AI_PROVIDER`に`openai`/`claude`を指定した際、意図が伝わるエラーメッセージで失敗する | `feat(conversation): add provider-switch stubs for OpenAI/Claude` |
| 35 | AIエリア講評: ドメイン・UseCase | `AiAreaReportRepository` interface、`GetAreaReportUseCase`実装（キャッシュ確認→なければ生成） | モックLlmClientでUseCaseの単体テストが通る | `feat(market): add area report generation use case` |
| 36 | AIエリア講評: DB・API・UI統合 | `ai_area_reports`テーブル追加、`/api/areas/[code]/report`実装、`AreaReportPanel`をエリア詳細に統合 | エリア詳細ページでAI生成レポートが表示され、再訪時はキャッシュから即座に表示される | `feat(market): integrate AI area report into area detail page` |
| 37 | 自然言語検索: パーサー実装 | `NaturalLanguageQueryParser` interface・実装（function callingで検索条件JSON化）、Zodスキーマで出力検証 | 「渋谷区で築10年以内5000万円台」→正しい検索条件JSONに変換されるテストが通る | `feat(conversation): add natural language query parser` |
| 38 | 自然言語検索: API・UI統合 | `/api/search/nl`実装、取引検索ページに自然文検索ボックスを追加 | 自然文入力から`/transactions`の絞り込み結果に遷移できる | `feat(transaction): add natural language search entry point` |
| 39 | 価格予測: ドメイン | `PredictionInput`/`PredictionResult` Value Object、`PricePredictionModel` interface、`HeuristicPricePredictionModel`（エリア平均坪単価＋築年数/駅距離補正）実装 | サンプル入力に対する予測値がテストで妥当な範囲に収まる | `feat(prediction): add heuristic price prediction model` |
| 40 | 価格予測: API・UI | `PredictPriceUseCase`, `/api/ai/predict`, `PredictForm`/`PredictResultCard`/`FeatureImportanceBar`実装 | フォーム入力→予測価格と寄与度が表示される | `feat(prediction): add price prediction page` |
| 41 | AIチャット: ドメイン・DB | `ChatSession`/`ChatMessage` Entity、`chat_sessions`/`chat_messages`テーブル、`PrismaChatRepository`実装 | チャットメッセージがDBに保存・取得できる | `feat(conversation): add chat session persistence` |
| 42 | AIチャット: ストリーミングAPI | `SendChatMessageUseCase`、`/api/ai/chat`（SSE）実装、統計データをコンテキスト注入するRAG的処理 | curlでSSEストリームが逐次返ってくることを確認 | `feat(conversation): add streaming chat endpoint` |
| 43 | AIチャット: UI | `/ai/chat`、`ChatWindow`/`ChatMessageBubble`/`ChatSuggestionChips`実装 | チャット画面で質問→ストリーミング回答が表示される | `feat(conversation): add AI chat page` |
| 44 | レート制限・フォールバック整備 | IPベースのレート制限（Upstash Redis等）、AI障害時のフォールバックUI確認 | 連続リクエストで制限が発動し、LLM障害時も他機能が縮退動作する | `feat(conversation): add rate limiting and AI fallback handling` |

**Phase 3完了条件**: 自然言語検索・AIレポート・AIチャット・価格予測の4機能がすべて実データと連携して動作している。

---

## Phase 4: UI改善

**ゴール**: ポートフォリオとしての第一印象を高めるビジュアル・体験の磨き込み。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 45 | デザインシステム整理 | カラーパレット・タイポグラフィのTailwind設定統一、`frontend-design`的な一貫性の見直し | 全ページで配色・余白のトンマナが統一される | `refactor(ui): unify design tokens across pages` |
| 46 | レスポンシブ対応の見直し | モバイルナビゲーション、地図・グラフのモバイルレイアウト調整 | 主要画面がスマートフォン幅で崩れずに操作できる | `fix(ui): improve responsive layout for mobile` |
| 47 | ダークモード対応 | `next-themes`導入、shadcn/ui・Chart.js・MapLibreスタイルのダーク対応 | テーマ切替で全コンポーネントが正しく配色変更される | `feat(ui): add dark mode support` |
| 48 | ローディング/Suspense整備 | 各ページに`loading.tsx`、スケルトンコンポーネント追加 | データ取得中にレイアウトシフトなくスケルトンが表示される | `feat(ui): add loading skeletons for async pages` |
| 49 | エラー画面のデザイン | `error.tsx`, `not-found.tsx`のデザイン、トースト通知の統一 | 意図的にエラーを発生させた際に分かりやすいUIが表示される | `feat(ui): design error and not-found pages` |
| 50 | グラフ・地図のビジュアル改善 | 配色・凡例・ツールチップの調整（dataviz観点でのアクセシブルな配色） | ヒートマップ・グラフの配色がライト/ダーク双方で判読しやすい | `refactor(ui): improve chart and map visual accessibility` |
| 51 | アクセシビリティ改善 | コントラスト比・キーボード操作・aria属性の見直し | Lighthouseのアクセシビリティスコアが基準値以上になる | `fix(a11y): improve keyboard navigation and contrast` |
| 52 | トップ・Aboutページ強化 | ポートフォリオとしてのストーリーテリング（アーキテクチャ図・技術選定理由の掲載）を作り込み | `/about`にアーキテクチャ図とスタック紹介が完成する | `feat: polish landing and about page content` |

**Phase 4完了条件**: 全画面が一貫したデザインで、モバイル・ダークモード・アクセシビリティに配慮された状態になっている。

---

## Phase 5: リリース

**ゴール**: 認証・個人化機能を追加し、本番公開に足る品質に仕上げる。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 53 | Supabase Auth導入 | Google OAuth設定、`@supabase/ssr`でのクライアント構成、`/login`ページ実装 | Googleログイン・ログアウトが動作する | `feat(identity): add Supabase Google OAuth login` |
| 54 | 認証Middleware・ガード | `middleware.ts`でセッション検証、`/favorites`への未認証アクセス制御 | 未ログイン時に`/favorites`から`/login`へリダイレクトされる | `feat(identity): add auth middleware for protected routes` |
| 55 | お気に入り機能 | `FavoriteArea` Entity、`favorite_areas`テーブル、`AddFavoriteUseCase`等、`/api/favorites`実装 | エリア詳細からお気に入り登録・解除ができる | `feat(identity): add favorite areas feature` |
| 56 | 保存検索条件機能 | `SavedSearch` Entity、`/api/saved-searches`、取引検索画面への保存導線追加 | 検索条件を保存し、一覧から再実行できる | `feat(identity): add saved search conditions feature` |
| 57 | RLSポリシー設定 | Supabase側でお気に入り・保存検索テーブルにRLS適用 | 他ユーザーのデータにAPI経由でもアクセスできないことを確認 | `chore(security): add RLS policies for user-owned tables` |
| 58 | お気に入り一覧ページ | `/favorites`実装（お気に入りエリア＋保存検索の一覧表示） | ログインユーザーが自分の保存データを閲覧・削除できる | `feat(identity): add favorites page` |
| 59 | SEO/OGP整備 | メタデータ・OGP画像・`sitemap.xml`・`robots.txt`設定 | 各ページのシェア時にOGPが正しく表示される | `feat: add SEO metadata and OGP images` |
| 60 | パフォーマンス最適化 | 画像最適化、バンドルサイズ確認、不要な再レンダリング解消 | Lighthouseパフォーマンススコアが基準値以上になる | `perf: optimize bundle size and image loading` |
| 61 | 本番環境変数・最終デプロイ設定 | Vercel本番環境の環境変数整理、ドメイン設定（任意） | 本番URLで全機能が想定通り動作する | `chore: finalize production environment configuration` |
| 62 | README・ドキュメント整備 | セットアップ手順、アーキテクチャ図、デモURL、スクリーンショットをREADMEに整理 | READMEだけで初見の採用担当者がプロジェクトの全体像を理解できる | `docs: complete README with architecture and setup guide` |

**Phase 5完了条件**: 認証・個人化機能を含めた全機能が本番環境で安定動作し、ポートフォリオとして公開できる状態になっている。

---

## Phase 6: 運用

**ゴール**: 継続的な品質担保・監視体制を整え、「保守性」「運用力」も示せる状態にする。

| Day | タスク | 実装内容 | 完了条件 | コミット例 |
|---|---|---|---|---|
| 63 | GitHub Actions CI構築 | `lint → typecheck → test → build`のワークフロー作成、PRごとに自動実行 | PR作成時にCIが自動実行され結果がステータスチェックに反映される | `ci: add GitHub Actions pipeline for lint/typecheck/test/build` |
| 64 | 単体テスト拡充 | Domain/Application層（market, transaction, prediction）のテストカバレッジ拡充 | 主要UseCaseのカバレッジが目標値に到達する | `test: expand unit test coverage for core use cases` |
| 65 | E2Eテスト導入 | Playwrightで主要導線（検索→詳細、AIチャット、お気に入り登録）のE2Eテスト作成 | CI上でE2Eテストが安定して通過する | `test: add Playwright e2e tests for critical user flows` |
| 66 | エラー監視導入 | Sentry等の導入、`requestId`とクライアントエラーの相関確認 | 意図的なエラーがSentryに記録され、requestIdで追跡できる | `chore: integrate error monitoring with Sentry` |
| 67 | データ定期同期バッチ | 国交省APIの定期同期を GitHub Actions cron / Vercel Cron で自動化、`sync_logs`記録 | スケジュール実行で最新データが自動反映される | `feat: automate periodic reinfolib data sync` |
| 68 | ログ・監視ダッシュボード整備 | AI呼び出しコスト・レイテンシ、APIエラー率の可視化（簡易ダッシュボードまたは外部サービス連携） | 主要メトリクスが1画面で確認できる | `feat(ops): add monitoring dashboard for AI usage and errors` |
| 69 | ADR整備・技術負債の棚卸し | `docs/adr/`に主要な設計判断を記録、既知の技術負債をIssue化 | 主要な意思決定がADRとして残り、負債がIssueで管理されている | `docs: add ADRs for key architecture decisions` |
| 70 | 継続改善サイクルの確立 | 障害対応フロー・振り返り（KPT等）のドキュメント化、次期拡張機能（住宅ローンシミュレーション等）のIssue起票 | 運用フローが文書化され、拡張ロードマップがIssueとして管理されている | `docs: document operational runbook and next roadmap items` |

**Phase 6完了条件**: CI/CD・監視・自動同期・ドキュメントが揃い、継続的に安全に機能追加できる運用体制が確立している。

---

## 全体サマリー

| Phase | 想定日数 | ゴール |
|---|---|---|
| Phase 1: MVP | 18日 | 実データでの取引検索・閲覧が本番URLで動作 |
| Phase 2: 分析機能 | 14日 | エリア統計・トレンド・比較・地図可視化が機能 |
| Phase 3: AI機能 | 12日 | 自然言語検索・AIレポート・AIチャット・価格予測が動作 |
| Phase 4: UI改善 | 8日 | デザイン一貫性・レスポンシブ・ダークモード・アクセシビリティ対応 |
| Phase 5: リリース | 10日 | 認証・お気に入り・SEO・本番公開品質の達成 |
| Phase 6: 運用 | 8日 | CI/CD・監視・自動同期・ドキュメント体制の確立 |
| **合計** | **約70日（1日1コミットペース）** | |

各タスクは独立してpush可能な単位に分割してあるが、実際の進捗に応じて前後してよい（例: Phase 4のデザイン改善をPhase 2の途中に差し込む等）。重要なのは「常にmainブランチがビルド・デプロイ可能な状態を保つ」ことであり、大きな機能追加も可能な限りこの単位まで分解してから着手する。
