import { conversationContainer } from "@/features/conversation/infrastructure/container";
import { badRequest, handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { type NextRequest } from "next/server";
import { z } from "zod";

const SendChatMessageRequestSchema = z.object({
  sessionId: z.string().nullable().optional(),
  message: z.string().trim().min(1).max(1000),
});

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();

  const parsed = SendChatMessageRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error, requestId);
  }

  const useCase = conversationContainer.getSendChatMessageUseCase();
  const result = await useCase.execute({
    sessionId: parsed.data.sessionId ?? null,
    message: parsed.data.message,
  });

  return result.match(
    (output) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(sseEvent("session", { sessionId: output.sessionId })));
          try {
            for await (const token of output.stream) {
              controller.enqueue(encoder.encode(sseEvent("token", { token })));
            }
            controller.enqueue(encoder.encode(sseEvent("done", {})));
          } catch (error) {
            controller.enqueue(encoder.encode(sseEvent("error", { message: String(error) })));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
    (error) => handleRouteError(error, requestId),
  );
}
