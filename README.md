# REMDA — Real Estate Market Dashboard

首都圏（東京都・神奈川県・千葉県・埼玉県）の不動産市場を、国土交通省「不動産情報ライブラリ」の実取引データから検索・比較・可視化するWebアプリケーションです。

[デモを見る](https://realestate-market-dashboard.vercel.app/) · [設計書](./docs/design.md) · [ロードマップ](./docs/roadmap.md) · [ADR](./docs/adr/)

## Phase 2で実装したこと

- 取引検索: 市区町村・物件種別・間取り・価格帯による絞り込みと詳細表示
- エリア分析: 中央値・坪単価・前期比・価格推移・間取り分布
- 市場比較: 坪単価ランキング、複数エリアの時系列比較、レーダーチャート
- マーケットマップ: MapLibre GLによる市区町村境界と坪単価ヒートマップ
- 統合ダッシュボード: 主要指標、トレンド、ランキング、地図を1画面に集約

## スクリーンショット

| 統合ダッシュボード | 坪単価ヒートマップ | エリア比較（レーダーチャート） |
|---|---|---|
| ![統合ダッシュボード](./docs/images/dashboard.jpg) | ![坪単価ヒートマップ](./docs/images/heatmap.jpg) | ![エリア比較](./docs/images/area-comparison.jpg) |

## 技術的な特徴

- **Feature First × Clean Architecture × DDD**: 機能単位でdomain / application / infrastructure / presentationを分離
- **型安全な境界**: Zodによる入力検証、Result型によるユースケースの成功・失敗表現、共通APIエラー形式
- **分析向け集計**: 市区町村×四半期で統計を事前集計し、IQR法で価格外れ値を除去
- **表示性能への配慮**: Server Components、集計済みテーブル、APIキャッシュ、ズームレベル別の地図データ取得
- **品質管理**: TypeScript、ESLint、Vitest、GitHub Actionsによる継続的な検証

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| 可視化 | MapLibre GL, Chart.js, GeoJSON |
| バックエンド | Next.js Route Handlers, Supabase (PostgreSQL), Prisma 7, Zod |
| テスト・運用 | Vitest, ESLint, GitHub Actions, Vercel |

## アーキテクチャ

```text
src/features/{feature}/
├── domain/          # Entity、Value Object、Repository interface
├── application/     # Use Case、Result
├── infrastructure/  # Prisma Repository、外部サービスとの接続
└── presentation/    # DTO、入力スキーマ、UI
```

依存方向を内側へ限定し、画面やデータベースの変更が市場分析のルールへ波及しにくい構成にしています。詳細と判断理由は[設計書](./docs/design.md)と[ADR](./docs/adr/)に記録しています。

## ローカルでの実行

Node.js 24系を使用します。

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`にSupabaseの`DATABASE_URL`と`DIRECT_URL`を設定してください。APIから新たにデータを取得する場合のみ`REINFOLIB_API_KEY`も必要です。実データと秘密情報はリポジトリに含めていません。

## 品質チェック

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

結合テストは実際のSupabaseへ接続するため、環境変数を設定した上で`npm run test:integration`を実行します。

## データ更新

```bash
npm run fetch:reinfolib -- --area 13 --quarters 4
npm run db:seed
npm run db:aggregate
```

取得元: [国土交通省 不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/)

## 主なページ

| パス | 内容 |
|---|---|
| `/dashboard` | 主要統計・価格トレンド・ランキング・地図の統合ビュー |
| `/transactions` | 実取引の検索・一覧 |
| `/areas` | 市区町村別ランキング |
| `/areas/[code]` | エリア詳細と価格推移・間取り分布 |
| `/trends` | 複数エリアの時系列比較 |
| `/areas/compare` | エリア比較 |
| `/map` | 坪単価ヒートマップ |

## 開発状況

- Phase 1: 取引検索、データ取込基盤、アーキテクチャ基盤 — 完了
- Phase 2: エリア分析、比較、地図、統合ダッシュボード — 完了
- Phase 3: AIを用いた分析支援 — 構想段階

このリポジトリは転職活動用ポートフォリオとして整備しています。
