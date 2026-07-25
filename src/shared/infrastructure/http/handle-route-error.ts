import type { ApplicationError } from "@/shared/application/application-error";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  TRANSACTION_NOT_FOUND: 404,
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
