import { marketContainer } from "@/features/market/infrastructure/container";
import { toAiAreaReportDto } from "@/features/market/presentation/mappers/ai-area-report.mapper";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError, rateLimitExceeded } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { checkAiRateLimit, getClientIp } from "@/shared/infrastructure/rate-limit/ai-rate-limiter";
import { NextResponse, type NextRequest } from "next/server";

// AIレポートはDB側で永続キャッシュされているため、CDN側も長めにキャッシュしてよい
const AREA_REPORT_CACHE = cacheHeaders(3600, 86400);

export async function GET(req: NextRequest, ctx: RouteContext<"/api/areas/[code]/report">) {
  const requestId = createRequestId();

  // 未生成エリアへの大量リクエストでGemini無料枠を消費されないよう、他のAI系エンドポイントと同じ制限をかける
  const rateLimit = await checkAiRateLimit(getClientIp(req));
  if (!rateLimit.success) {
    return rateLimitExceeded(requestId);
  }

  const { code } = await ctx.params;

  const useCase = marketContainer.getAreaReportUseCase();
  const result = await useCase.execute({ code });

  return result.match(
    (report) => NextResponse.json({ data: toAiAreaReportDto(report) }, { headers: AREA_REPORT_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
