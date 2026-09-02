# Supabase無料プラン停止からの復旧手順

## なぜ起きるか

Supabase無料プランは**7日間アクセス（ログイン）がないとプロジェクトが自動停止（Pause）**される。長期間（目安90日以上）放置すると、単なる停止ではなく**プロジェクトが完全に削除され、次回作成時は別プロジェクト（project refが変わる）として扱われる**ことがある。この場合、旧project refの接続情報は二度と使えず、新規プロジェクト相当の対応（DBパスワード再発行・スキーマ再作成・データ再投入）が必要になる。

**注意**: Supabaseダッシュボードでプロジェクトのステータスが「Healthy」と表示されていても、project ref自体が変わっている（＝別プロジェクトとして再作成された）ことがある。「Pausedではないから大丈夫」と判断せず、必ずproject refそのものを確認すること（手順1参照）。

## 症状は2パターンある

| 症状 | 原因の系統 | 参照 |
|---|---|---|
| サイトを開くと「ダッシュボードサマリーの取得に失敗しました」等、DB系のエラーが出る | Supabase（データベース）側の問題 | パターンA |
| データは表示されるが、AIチャット・AIエリア講評だけが極端に遅い／タイムアウトする | Gemini API側の一時的な過負荷 | パターンB |

---

## パターンA: DB接続の問題（ダッシュボード等が表示されない）

### 1. Supabaseプロジェクトの識別子（project ref）を確認する

1. https://supabase.com/dashboard にログインし、対象プロジェクトを開く
2. ブラウザのURL（`https://supabase.com/dashboard/project/<project-ref>`）または Settings → General に表示される識別子を確認する
3. `.env`の`DATABASE_URL`/`DIRECT_URL`に含まれる`postgres.<project-ref>`の`<project-ref>`部分と一致しているか照合する
4. **一致していなければ、プロジェクトが再作成されており旧接続情報は使えない。** 手順4へ進む
5. 一致していて、ステータスが「Paused」なら「Restore」（または「Resume」）で再開してから手順2へ
6. 一致していて「Healthy」なのに繋がらない場合は、まず https://status.supabase.com/ でSupabase全体の障害情報を確認する（過去に「API Gatewayの障害」が数週間続いたことがある）。障害が出ていれば、Settings → General → 「Restart project」を試す

### 2. 状況を切り分ける（原因特定）

**独立したNode.jsスクリプト（`npx tsx scripts/xxx.ts`）からのDB接続確認は、開発環境によっては`ECONNREFUSED`になり機能しないことがある**（ネットワーク経路の制約。原因不明でも気にしなくてよい）。その場合は、開発サーバー経由でAPI Routeとして疎通確認する方が確実。

```bash
cd C:\Users\piech\Projects\realestate-market-dashboard
npm run dev
```

サーバー起動後、以下のような一時的なデバッグAPI（`src/app/api/debugdb/route.ts`）を作って`http://localhost:3000/api/debugdb`にアクセスし、**確認後は必ず削除する**。

```ts
import { prisma } from "@/shared/infrastructure/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await prisma.areaStatistics.aggregate({ _max: { period: true } });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, errorMessage: e instanceof Error ? e.message : String(e) });
  }
}
```

エラーメッセージで症状を切り分ける。

| エラーメッセージ | 原因 | 対応 |
|---|---|---|
| `(ENOTFOUND) tenant/user ... not found` | project refが無効（削除/変更された） | 手順1・4へ |
| `(ECIRCUITBREAKER) too many authentication failures, new connections are temporarily blocked` | 誤った接続情報での接続試行を繰り返し、一時的にブロックされている | 5〜10分待ってから再試行。慌てて何度も再試行するとブロック時間が延びるので注意 |
| `password authentication failed for user "postgres"` | パスワードが違う（typo・コピペミスの可能性が高い） | 手順3へ。**手で組み立てず、ダッシュボードの接続文字列をそのままコピーする** |
| `Invalid URL` | パスワードに`/` `@`等の特殊文字が入っていてURLが壊れている | 手順3の注記へ |
| `The table "public.xxx" does not exist` | DBにスキーマが無い、またはマイグレーションが古い | 手順5へ |

### 3. 新しい接続文字列を取得する

Supabaseダッシュボード → 対象プロジェクト → Settings → Database → 「Connect」ボタンを開く。

- **パスワードが分からない場合**: 同じ画面の「Reset database password」で新規発行する
- **接続文字列は手で組み立てない**: `postgres.<project-ref>`のような部分は間違えやすいため、画面に表示される接続文字列（Transaction pooler / Direct connection）をそのままコピーし、`[YOUR-PASSWORD]`の部分だけ実際のパスワードに差し替える
- `DATABASE_URL`には「Transaction pooler」（ポート6543）、`DIRECT_URL`には「Direct connection」（ポート5432、`db.<project-ref>.supabase.co`形式）を使う

パスワードに `/` `@` `:` `#` `?` などの記号が含まれる場合は、以下でURLエンコードしてから使う。

```bash
node -e "console.log(encodeURIComponent('ここに新パスワード'))"
```

`.env`のイメージ:

```
DATABASE_URL="postgresql://postgres.<project-ref>:<encodedパスワード>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.<project-ref>:<encodedパスワード>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 4. project refが変わっていた場合（プロジェクト再作成）

`.env`のproject ref部分（`postgres.xxxxx`の`xxxxx`）を新しいものに差し替え、手順3でパスワードも更新する。

**プロジェクト再作成後のDBは「完全に空」とは限らない。** 過去のバックアップから一部データが復元された状態（テーブルはあるがマイグレーション履歴が古い）のこともある。次の手順5で必ず確認すること。

### 5. マイグレーションが最新か確認・適用する

`.env`更新後、開発サーバーを再起動してから一時的なデバッグAPI等で以下を確認する。

```sql
SELECT migration_name FROM _prisma_migrations ORDER BY migration_name;
```

`prisma/migrations/`配下のフォルダ一覧と比較し、不足があれば以下を実行する（**このコマンドはClaude側では安全フックによりブロックされるため、必ずユーザー自身のターミナルで実行する**）。

```bash
cd C:\Users\piech\Projects\realestate-market-dashboard
npx prisma migrate deploy
```

**特に見落としやすいのが、`enable_rls`マイグレーション（Row Level Securityの設定）。** これが未適用だと、Supabaseの自動生成APIから外部の誰でもテーブルを読み書きできてしまう状態に戻ってしまう。マイグレーション適用後、全テーブルで`rowsecurity = true`になっているか（`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`）を必ず確認する。

DBが本当に空（テーブル自体が無い）の場合のみ、データも入れ直す。

```bash
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
2. `DATABASE_URL`（と、使っていれば`DIRECT_URL`）を編集し、手順3・4で確定した最新の接続文字列に貼り替える
3. Deploymentsタブから最新デプロイを「Redeploy」（環境変数変更は再デプロイしないと反映されない）
4. 本番URL（`https://realestate-market-dashboard.vercel.app/dashboard`）を開いて確認

※ `prisma/schema.prisma`の`datasource`には`directUrl`の指定が無いため、Vercel側は`DATABASE_URL`のみで動作する（`DIRECT_URL`はローカルでのマイグレーション実行時にのみ使用）。

---

## パターンB: AIチャット・AIエリア講評だけが遅い／タイムアウトする

ダッシュボード等のDB系機能は正常なのに、AI機能だけがVercelで「Task timed out after 300 seconds」になる、あるいはローカルで60〜120秒待っても応答が返らない場合、**Supabase/DBの問題ではなくGoogle Gemini API側の一時的な過負荷**の可能性が高い。

### 切り分け方

開発サーバーのログ（`preview_logs`相当、または実行中ターミナルの出力）に、以下のようなエラーが出ていないか確認する。

```
ApiError: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
```

このメッセージが出ていれば、原因はGoogle側のサービス過負荷であり、REMDA側のコード・DB・環境変数には問題がない。SDKが内部で自動リトライを繰り返すため、失敗と判断されるまでに数十秒〜数分かかることがある（これがVercelの300秒タイムアウトの直接原因になる）。

### 対応

- こちら側で直ちに修正できるものではないため、**時間を置いてから再度試す**（「usually temporary」の通り、通常は自然に回復する）
- Gemini APIキー自体の設定ミス（未設定・失効）が原因の場合は、別のエラーメッセージ（`GEMINI_API_KEYが設定されていません` 等）が即座に返る。この場合はDB側と同様、Vercelの環境変数（`GEMINI_API_KEY`）を確認する

---

## 再発防止（できれば検討）

- 週1回程度、Supabaseダッシュボードにログインするだけでも自動停止は回避できる（無料プランの制約を許容し続けるなら運用でカバー）
- 有料プラン（Pro以上）に上げれば自動停止自体が発生しない
- `data/reinfolib/*.json`の生データはバックアップとして貴重（DB全消失時の再構築の生命線）なので、誤って削除しないよう`.gitignore`の除外対象になっていないか等、保管場所は定期的に確認する
- project refが変わった場合、RLS設定（`enable_rls`マイグレーション）の再適用を忘れやすいので、復旧作業の最後に必ずセキュリティ設定を再確認する
