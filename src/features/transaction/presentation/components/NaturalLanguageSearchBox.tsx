"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NaturalLanguageSearchResult {
  municipalityCode?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBuildingYear?: number;
}

// 「渋谷区で築10年以内5000万円台」のような自然文から/api/search/nlで検索条件を抽出し、
// /transactionsの絞り込み結果へ遷移させる。既存のTransactionFilterPanel（条件を個別選択するUI）とは別の入口。
export function NaturalLanguageSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/search/nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`request failed: ${res.status}`);

      const body = (await res.json()) as { data: NaturalLanguageSearchResult };
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body.data)) {
        if (value !== undefined) params.set(key, String(value));
      }
      setStatus("idle");
      router.push(params.toString() ? `/transactions?${params.toString()}` : "/transactions");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="自然文検索" className="mb-4 flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例: 渋谷区で築10年以内5000万円台の中古マンション"
          aria-label="自然文検索クエリ"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "検索中…" : "AIで検索"}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-xs text-destructive">検索条件の解析に失敗しました。しばらくしてから再度お試しください。</p>
      )}
    </form>
  );
}
