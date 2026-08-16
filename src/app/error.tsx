"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // requestId等の詳細はサーバーログ側に既にあるため、ここではブラウザの開発者コンソールにのみ残す
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-6 text-2xl font-bold">問題が発生しました</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        ページの表示中にエラーが発生しました。しばらくしてから再度お試しいただくか、ダッシュボードへお戻りください。
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => reset()}>
          <RotateCw /> 再試行する
        </Button>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          ダッシュボードへ戻る
        </Button>
      </div>
    </div>
  );
}
