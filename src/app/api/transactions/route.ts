import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { TransactionSearchQuerySchema } from "@/features/transaction/presentation/schemas/transaction-query.schema";
import { Money } from "@/shared/domain/value-objects/money";
import { badRequest, handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const requestId = createRequestId();

  const query = TransactionSearchQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!query.success) return badRequest(query.error, requestId);

  const { minPrice, maxPrice, ...rest } = query.data;
  const useCase = transactionContainer.getSearchTransactionsUseCase();
  const result = await useCase.execute({
    ...rest,
    minPrice: minPrice !== undefined ? Money.fromYen(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? Money.fromYen(maxPrice) : undefined,
  });

  return result.match(
    (transactions) => NextResponse.json({ data: transactions.map(toTransactionSummary) }),
    (error) => handleRouteError(error, requestId),
  );
}
