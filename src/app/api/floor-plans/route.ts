import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse } from "next/server";

// 間取りの種類は取引データのバッチ投入時にしか増減しないため長めにキャッシュする
const FLOOR_PLANS_CACHE = cacheHeaders(86400, 604800);

export async function GET() {
  const requestId = createRequestId();
  const useCase = transactionContainer.getListFloorPlansUseCase();
  const result = await useCase.execute();

  return result.match(
    (floorPlans) => NextResponse.json({ data: floorPlans }, { headers: FLOOR_PLANS_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
