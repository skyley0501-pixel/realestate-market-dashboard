import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ClaudeLlmClient, GeminiLlmClient, OpenAiLlmClient, type LlmClient } from "./llm-client";

describe("GeminiLlmClient", () => {
  it("モデル名にproを含む場合はコンストラクタで拒否する（有料枠への誤切り替え防止）", () => {
    expect(() => new GeminiLlmClient("dummy-key", "gemini-3.5-pro")).toThrow(/有料枠/);
  });

  it("無料枠のFlashモデル名は許可する", () => {
    expect(() => new GeminiLlmClient("dummy-key", "gemini-3.5-flash")).not.toThrow();
  });
});

describe("OpenAiLlmClient (差し替え候補のスタブ)", () => {
  const client: LlmClient = new OpenAiLlmClient();

  it("completeStructuredは未実装であることを伝えるエラーを投げる", () => {
    expect(() => client.completeStructured("prompt", z.object({}))).toThrow(/未実装/);
  });

  it("streamChatは未実装であることを伝えるエラーを投げる", () => {
    expect(() => client.streamChat([])).toThrow(/未実装/);
  });
});

describe("ClaudeLlmClient (差し替え候補のスタブ)", () => {
  const client: LlmClient = new ClaudeLlmClient();

  it("completeStructuredは未実装であることを伝えるエラーを投げる", () => {
    expect(() => client.completeStructured("prompt", z.object({}))).toThrow(/未実装/);
  });

  it("streamChatは未実装であることを伝えるエラーを投げる", () => {
    expect(() => client.streamChat([])).toThrow(/未実装/);
  });
});
