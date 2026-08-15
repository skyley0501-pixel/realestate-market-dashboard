import { afterEach, describe, expect, it, vi } from "vitest";
import { ClaudeLlmClient, GeminiLlmClient, OpenAiLlmClient } from "./llm-client";
import { conversationContainer } from "./container";

describe("conversationContainer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("AI_PROVIDER未指定時はGEMINI_API_KEYがあればGeminiLlmClientを返す", () => {
    vi.stubEnv("AI_PROVIDER", undefined);
    vi.stubEnv("GEMINI_API_KEY", "dummy-key");

    expect(conversationContainer.getLlmClient()).toBeInstanceOf(GeminiLlmClient);
  });

  it("AI_PROVIDER=geminiでGEMINI_API_KEY未設定の場合は分かりやすいエラーになる", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", undefined);

    expect(() => conversationContainer.getLlmClient()).toThrow(/GEMINI_API_KEY/);
  });

  it("AI_PROVIDER=openaiはOpenAiLlmClient（スタブ）を返す", () => {
    vi.stubEnv("AI_PROVIDER", "openai");

    expect(conversationContainer.getLlmClient()).toBeInstanceOf(OpenAiLlmClient);
  });

  it("AI_PROVIDER=claudeはClaudeLlmClient（スタブ）を返す", () => {
    vi.stubEnv("AI_PROVIDER", "claude");

    expect(conversationContainer.getLlmClient()).toBeInstanceOf(ClaudeLlmClient);
  });

  it("未対応のAI_PROVIDERは分かりやすいエラーになる", () => {
    vi.stubEnv("AI_PROVIDER", "unknown-provider");

    expect(() => conversationContainer.getLlmClient()).toThrow(/未対応のAI_PROVIDER/);
  });
});
