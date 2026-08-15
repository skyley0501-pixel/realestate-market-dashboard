import { conversationContainer } from "@/features/conversation/infrastructure/container";
import { badRequest, handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const NaturalLanguageSearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const requestId = createRequestId();

  const parsed = NaturalLanguageSearchRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error, requestId);
  }

  const useCase = conversationContainer.getParseNaturalLanguageSearchUseCase();
  const result = await useCase.execute({ query: parsed.data.query });

  return result.match(
    (condition) => NextResponse.json({ data: condition }),
    (error) => handleRouteError(error, requestId),
  );
}
