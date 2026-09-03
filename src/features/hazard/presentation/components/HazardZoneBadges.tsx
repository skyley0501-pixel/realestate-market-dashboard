import { Badge } from "@/components/ui/badge";
import type { HazardZoneDto } from "../mappers/area-hazard-info.mapper";

export interface HazardZoneBadgesProps {
  hazardZone: HazardZoneDto | null;
}

// 洪水浸水想定区域・土砂災害警戒区域の該当有無をバッジで表示する。
// 判定は市区町村代表点周辺の簡易判定（詳細はscripts/fetch-hazard-zones.tsのコメント参照）のため、
// 個別物件の正確なリスクは国交省ハザードマップポータルサイトで住所指定の確認を促す注記を添える。
export function HazardZoneBadges({ hazardZone }: HazardZoneBadgesProps) {
  if (!hazardZone) {
    return <p className="text-sm text-muted-foreground">このエリアの防災情報はまだ取得していません。</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant={hazardZone.floodZone ? "destructive" : "outline"}>
          洪水浸水想定区域{hazardZone.floodZone ? "：該当あり" : "：該当なし"}
        </Badge>
        <Badge variant={hazardZone.landslideZone ? "destructive" : "outline"}>
          土砂災害警戒区域{hazardZone.landslideZone ? "：該当あり" : "：該当なし"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        エリア内の代表地点付近を対象にした簡易判定です（{hazardZone.checkedAt}時点）。個別の物件については
        <a
          href="https://disaportal.gsi.go.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          ハザードマップポータルサイト
        </a>
        で住所を指定して確認してください。
      </p>
    </div>
  );
}
