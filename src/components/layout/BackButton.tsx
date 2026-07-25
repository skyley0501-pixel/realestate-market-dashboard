"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// 一覧ページの検索条件（URL query params）を維持したまま戻れるよう、
// 固定リンクではなくブラウザ履歴を使う。
export function BackButton() {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.back()}>
      ← 一覧に戻る
    </Button>
  );
}
