import { marketContainer } from "@/features/market/infrastructure/container";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

const AREA_DETAIL_CACHE = cacheHeaders(3600, 86400);

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/areas/[code]">) {
  const requestId = createRequestId();
  const { code } = await ctx.params;

  const useCase = marketContainer.getAreaDetailUseCase();
  const result = await useCase.execute({ code });

  return result.match(
    (snapshot) => NextResponse.json({ data: toAreaSnapshotDto(snapshot) }, { headers: AREA_DETAIL_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
