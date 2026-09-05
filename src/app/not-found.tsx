import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-6 text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        指定されたページは存在しないか、移動または削除された可能性があります。URLをご確認いただくか、以下からトップページへお戻りください。
      </p>
      <div className="mt-8 flex gap-3">
        <Button render={<Link href="/" />}>
          <ArrowLeft /> トップページへ戻る
        </Button>
      </div>
    </div>
  );
}
