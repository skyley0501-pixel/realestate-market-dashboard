import "dotenv/config";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GeminiLlmClient } from "./llm-client";

// 実際のGemini APIに対する結合テスト。GEMINI_API_KEYが.envに必要（無料枠のFlashモデルを使用）。
describe("GeminiLlmClient (integration)", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEYが設定されていません。.envを確認してください。");
  }
  const client = new GeminiLlmClient(apiKey);

  it("completeStructuredで単純なプロンプトに対しZodスキーマ通りのJSONが返る", async () => {
    const schema = z.object({ answer: z.number() });

    const result = await client.completeStructured(
      "1 + 1 の答えだけをJSONで返してください。",
      schema,
    );

    expect(result.answer).toBe(2);
  }, 30_000);

  it("streamChatで応答テキストがストリーミングされる", async () => {
    const chunks: string[] = [];

    for await (const chunk of client.streamChat([
      { role: "user", content: "こんにちは、とだけ一言返してください。" },
    ])) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).not.toHaveLength(0);
  }, 30_000);
});
