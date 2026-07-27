import { marketContainer } from "@/features/market/infrastructure/container";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse } from "next/server";

// AreaStatisticsは手動実行の集計バッチでのみ更新されるため、1時間キャッシュしつつ1日はstale-while-revalidateで許容する
const AREA_LIST_CACHE = cacheHeaders(3600, 86400);

export async function GET() {
  const requestId = createRequestId();

  const useCase = marketContainer.getListAreasUseCase();
  const result = await useCase.execute();

  return result.match(
    (snapshots) =>
      NextResponse.json({ data: snapshots.map(toAreaSnapshotDto) }, { headers: AREA_LIST_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
