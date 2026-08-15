"use client";

import { useEffect, useState } from "react";
import type { AiAreaReportDto } from "../mappers/ai-area-report.mapper";

type ReportState =
  | { status: "loading" }
  | { status: "success"; report: AiAreaReportDto }
  | { status: "error" };

// 初回生成はLLM呼び出しが挟まり数秒かかるため、Client Componentでローディング/失敗時のフォールバックを出し分ける。
// 2回目以降はGetAreaReportUseCase側のDBキャッシュにより即座に返る。
// codeが変わった際にloading状態へ戻すため、呼び出し側で key={code} を指定してマウントし直す想定。
export function AreaReportPanel({ code }: { code: string }) {
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/areas/${code}/report`)
      .then((res) => {
        if (!res.ok) throw new Error(`request failed: ${res.status}`);
        return res.json() as Promise<{ data: AiAreaReportDto }>;
      })
      .then((body) => {
        if (!cancelled) setState({ status: "success", report: body.data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.status === "loading") {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">AIによる市況講評を生成中です…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-destructive">AI講評の取得に失敗しました。しばらくしてから再度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm leading-relaxed">{state.report.content}</p>
    </div>
  );
}
