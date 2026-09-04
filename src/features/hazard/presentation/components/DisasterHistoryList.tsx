import { Badge } from "@/components/ui/badge";
import type { DisasterHistoryDto } from "../mappers/area-hazard-info.mapper";

export interface DisasterHistoryListProps {
  histories: DisasterHistoryDto[];
}

// 過去の水害・土砂災害履歴を一覧表示する。出典は国交省「不動産情報ライブラリ」（国土調査由来）。
export function DisasterHistoryList({ histories }: DisasterHistoryListProps) {
  if (histories.length === 0) {
    return <p className="text-sm text-muted-foreground">記録されている水害・土砂災害の履歴はありません。</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {histories.map((item) => (
          <li key={`${item.disasterTypeCode}-${item.occurredOn}`} className="flex items-start gap-3">
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              {item.disasterName}
            </Badge>
            <div className="min-w-0">
              <p className="text-sm leading-6">{item.occurredOn}</p>
              {item.source && <p className="text-xs text-muted-foreground">出典: {item.source}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        出典: 国土交通省「不動産情報ライブラリ」（国土調査「土地履歴調査」データ）
      </p>
    </div>
  );
}
