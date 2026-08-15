import { marketContainer } from "@/features/market/infrastructure/container";
import { toAiAreaReportDto } from "@/features/market/presentation/mappers/ai-area-report.mapper";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

// AIレポートはDB側で永続キャッシュされているため、CDN側も長めにキャッシュしてよい
const AREA_REPORT_CACHE = cacheHeaders(3600, 86400);

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/areas/[code]/report">) {
  const requestId = createRequestId();
  const { code } = await ctx.params;

  const useCase = marketContainer.getAreaReportUseCase();
  const result = await useCase.execute({ code });

  return result.match(
    (report) => NextResponse.json({ data: toAiAreaReportDto(report) }, { headers: AREA_REPORT_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
