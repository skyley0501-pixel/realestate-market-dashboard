import { marketContainer } from "@/features/market/infrastructure/container";
import type { HeatmapGranularity } from "@/features/market/application/use-cases/get-heatmap.usecase";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

// AreaStatisticsは手動実行の集計バッチでのみ更新されるため、1時間キャッシュしつつ1日はstale-while-revalidateで許容する
const HEATMAP_CACHE = cacheHeaders(3600, 86400);

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const granularity = (req.nextUrl.searchParams.get("granularity") ?? "municipality") as HeatmapGranularity;

  const useCase = marketContainer.getHeatmapUseCase();
  const result = await useCase.execute({ granularity });

  return result.match(
    (cells) => NextResponse.json({ data: cells }, { headers: HEATMAP_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
