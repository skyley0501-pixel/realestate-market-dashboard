# 0002: `@hookform/resolvers`導入時に`--legacy-peer-deps`を使用した件

- ステータス: 解消済み（記録として残す）
- 日付: 2026-07-25（発生）/ 2026-07-26（クリーンインストールでの再現確認・解消確認）

## コンテキスト

Day15で`react-hook-form`と`@hookform/resolvers`を導入する際、通常の`npm install`が以下のエラーで失敗した。

```
npm error Found: valibot@0.39.0
npm error   peerOptional valibot@"^0.39.0" from @typeschema/valibot@0.14.0
npm error     peerOptional @typeschema/valibot@"0.14.0" from @typeschema/main@0.14.1
npm error       peerOptional @typeschema/main@">=0.13.7" from @hookform/resolvers@5.4.2
npm error Could not resolve dependency:
npm error peerOptional valibot@"^1.0.0 || ..." from @hookform/resolvers@5.4.2
```

`@hookform/resolvers`が内部で保持する複数スキーマライブラリ（zod, valibot, yup等）向けのoptional peer依存同士が競合していた。当プロジェクトはzodResolverのみ使用し、valibotは使用しない。

## 決定（当時）

`npm install react-hook-form @hookform/resolvers --legacy-peer-deps`でインストールした。

## その後の検証（Day18、2026-07-26）

Vercelでのクリーンインストール失敗リスクを懸念し、`node_modules`を完全に削除した状態から**フラグ無しの`npm install`**を実行したところ、**成功した**。`package-lock.json`に既に解決済みの依存関係グラフが記録されているため、再インストール時にはピア依存の再解決が発生せず、`--legacy-peer-deps`は不要だった。

`npm run build`も同じクリーン環境で成功を確認済み（Vercelの標準ビルドコマンドと同等の状況を再現）。

## 結論

- ローカル環境・Vercel環境とも、現在の`package-lock.json`をコミットした状態であれば追加のフラグは不要
- `--legacy-peer-deps`はDay15時点の依存関係追加作業でのみ使用し、恒久的な設定（`.npmrc`等）としては導入していない
- 将来`npm install`で依存関係を追加・更新する際に同様のエラーが再発する可能性はあるため、その際は本ADRを参照し、フラグを使う場合も一時的な使用に留め、その後クリーンインストールで再検証すること
