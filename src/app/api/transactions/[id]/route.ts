import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  const requestId = createRequestId();
  const { id } = await ctx.params;

  const useCase = transactionContainer.getTransactionDetailUseCase();
  const result = await useCase.execute({ id });

  return result.match(
    (transaction) => NextResponse.json({ data: toTransactionSummary(transaction) }),
    (error) => handleRouteError(error, requestId),
  );
}
