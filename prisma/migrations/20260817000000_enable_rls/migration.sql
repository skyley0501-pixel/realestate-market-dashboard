-- Supabaseのセキュリティ警告（rls_disabled_in_public / センシティブな列が公開されました）への対応。
--
-- アプリはSupabaseの postgres.<project-ref> ロール（テーブルオーナー相当）でDBに接続しており、
-- このロールはRow Level Securityを自動的にバイパスするため、本マイグレーションはPrisma経由の
-- アプリ動作には影響しない。影響を受けるのは、Supabaseが自動生成するREST API
-- （anon / authenticated ロール）経由で外部から直接テーブルへアクセスするケースのみで、
-- これがSupabaseの警告が指摘している「プロジェクトのURLを知っている人なら誰でも読み書きできる」経路。

-- 公開統計・マスタ・取引データ: 読み取りのみ許可（誰でもSELECT可、INSERT/UPDATE/DELETEはポリシー未定義のため拒否）
ALTER TABLE "prefectures" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "prefectures" FOR SELECT USING (true);

ALTER TABLE "municipalities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "municipalities" FOR SELECT USING (true);

ALTER TABLE "stations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "stations" FOR SELECT USING (true);

ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "transactions" FOR SELECT USING (true);

ALTER TABLE "area_statistics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "area_statistics" FOR SELECT USING (true);

ALTER TABLE "ai_area_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "ai_area_reports" FOR SELECT USING (true);

-- AIチャットの会話内容（ユーザーの自由入力テキストを含む）: 外部からは一切アクセスできないようにする。
-- ポリシーを作らずRLSを有効化するのみで、anon / authenticated ロールからの全操作（SELECT含む）を拒否する。
ALTER TABLE "chat_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
