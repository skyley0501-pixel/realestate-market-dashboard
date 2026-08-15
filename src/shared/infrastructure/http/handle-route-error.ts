import type { ApplicationError } from "@/shared/application/application-error";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  TRANSACTION_NOT_FOUND: 404,
  AREA_NOT_FOUND: 404,
  TREND_INVALID_CODES: 400,
  COMPARE_INVALID_CODES: 400,
  HEATMAP_INVALID_GRANULARITY: 400,
  MUNICIPALITY_INVALID_PREFECTURE_CODE: 400,
  INVALID_PREDICTION_INPUT: 400,
  AREA_NOT_FOUND_FOR_PREDICTION: 404,
};

export function handleRouteError(error: ApplicationError, requestId: string): NextResponse {
  console.error(JSON.stringify({ requestId, code: error.code, message: error.message }));
  return NextResponse.json(
    { error: { code: error.code, message: error.userMessage, requestId } },
    { status: STATUS_MAP[error.code] ?? 500 },
  );
}

export function badRequest(zodError: ZodError, requestId: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message: "リクエストパラメータが不正です。",
        details: zodError.issues,
        requestId,
      },
    },
    { status: 400 },
  );
}
