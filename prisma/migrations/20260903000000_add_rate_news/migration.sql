-- CreateTable
CREATE TABLE "rate_news" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_news_url_key" ON "rate_news"("url");

-- CreateIndex
CREATE INDEX "rate_news_published_at_idx" ON "rate_news"("published_at");

-- 公開統計データテーブルのため、既存方針（RLS: 読み取りのみ許可）に合わせる
ALTER TABLE "rate_news" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON "rate_news" FOR SELECT USING (true);
