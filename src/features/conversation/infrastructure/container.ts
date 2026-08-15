import { ClaudeLlmClient, GeminiLlmClient, OpenAiLlmClient, type LlmClient } from "./llm-client";

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

export const conversationContainer = {
  getLlmClient: (): LlmClient => createLlmClient(),
};
