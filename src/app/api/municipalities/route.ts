import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { cacheHeaders } from "@/shared/infrastructure/cache/query-cache-headers";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

// 市区町村マスタは手動のシード投入でしか変わらないため長めにキャッシュする
const MUNICIPALITIES_CACHE = cacheHeaders(86400, 604800);

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const prefectureCode = req.nextUrl.searchParams.get("prefectureCode") ?? "";

  const useCase = transactionContainer.getListMunicipalitiesUseCase();
  const result = await useCase.execute({ prefectureCode });

  return result.match(
    (municipalities) => NextResponse.json({ data: municipalities }, { headers: MUNICIPALITIES_CACHE }),
    (error) => handleRouteError(error, requestId),
  );
}
