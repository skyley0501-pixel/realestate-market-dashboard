import { PrismaAreaRepository } from "@/features/market/infrastructure/prisma-area-repository";
import { PrismaMunicipalityRepository } from "@/features/transaction/infrastructure/prisma-municipality-repository";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { ParseNaturalLanguageSearchUseCase } from "../application/use-cases/parse-natural-language-search.usecase";
import { SendChatMessageUseCase } from "../application/use-cases/send-chat-message.usecase";
import { ClaudeLlmClient, GeminiLlmClient, OpenAiLlmClient, type LlmClient } from "./llm-client";
import { LlmNaturalLanguageQueryParser } from "./llm-natural-language-query-parser";
import { PrismaChatRepository } from "./prisma-chat-repository";

// DIコンポジションルート。AI_PROVIDER環境変数で実装を切り替える（デフォルト: gemini）。
// OpenAI/Claudeは恒久的な無料枠が無いため、差し替え候補のスタブのみ用意している（ADR 0003）。
function createLlmClient(): LlmClient {
  const provider = process.env.AI_PROVIDER ?? "gemini";

  switch (provider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEYが設定されていません。");
      }
      return new GeminiLlmClient(apiKey);
    }
    case "openai":
      return new OpenAiLlmClient();
    case "claude":
      return new ClaudeLlmClient();
    default:
      throw new Error(`未対応のAI_PROVIDERです: ${provider}`);
  }
}

const municipalityRepository = new PrismaMunicipalityRepository(prisma);
const areaRepository = new PrismaAreaRepository(prisma);
const chatRepository = new PrismaChatRepository(prisma);

export const conversationContainer = {
  getLlmClient: (): LlmClient => createLlmClient(),
  getParseNaturalLanguageSearchUseCase: () =>
    new ParseNaturalLanguageSearchUseCase(new LlmNaturalLanguageQueryParser(createLlmClient()), municipalityRepository),
  getSendChatMessageUseCase: () =>
    new SendChatMessageUseCase(
      chatRepository,
      createLlmClient(),
      areaRepository,
      municipalityRepository,
      new LlmNaturalLanguageQueryParser(createLlmClient()),
    ),
};
