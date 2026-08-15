import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export interface LlmChatMessage {
  role: "user" | "assistant";
  content: string;
}

// AI_PROVIDERで実装を切り替える抽象化（container.ts参照）。UseCase・Presentation層はどのプロバイダかを知らない。
export interface LlmClient {
  completeStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
  streamChat(messages: LlmChatMessage[]): AsyncIterable<string>;
}

// 2026年8月時点でGemini APIの無料枠（Google AI Studio、カード登録不要）はFlash/Flash-Lite系モデルのみ。
// Proモデル等は有料のため、意図せず切り替わって課金が発生しないようモデル名を検証する。
// gemini-3.5-flashは複雑なプロンプトで日本語固有名詞が文字化けする不具合を確認したため、
// gemini-3.6-flash（同条件で5/5回正常）を採用している（詳細はADR 0004）。
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const PAID_ONLY_MODEL_PATTERN = /\bpro\b/i;

export class GeminiLlmClient implements LlmClient {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_GEMINI_MODEL) {
    if (PAID_ONLY_MODEL_PATTERN.test(model)) {
      throw new Error(
        `モデル "${model}" は有料枠の可能性があるため使用を拒否しました。無料枠のFlash/Flash-Liteモデルを指定してください。`,
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async completeStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(schema),
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini APIから空の応答が返されました。");
    }
    return schema.parse(JSON.parse(text));
  }

  async *streamChat(messages: LlmChatMessage[]): AsyncIterable<string> {
    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
}

// 将来コスト・レイテンシ比較のうえプロバイダを切り替える際の差し替え候補として、
// LlmClientの実装だけを用意しておく（Day34）。OpenAI/Claude APIは恒久的な無料枠が
// 無いため、実際のAPI呼び出しは未実装のまま明示的にエラーを投げる（詳細はADR 0003）。
export class OpenAiLlmClient implements LlmClient {
  completeStructured<T>(): Promise<T> {
    throw new Error(
      "OpenAiLlmClientは未実装です。OpenAI APIには恒久的な無料枠が無いため導入を見送っています（ADR 0003参照）。AI_PROVIDER=geminiを使用してください。",
    );
  }

  streamChat(): AsyncIterable<string> {
    throw new Error(
      "OpenAiLlmClientは未実装です。OpenAI APIには恒久的な無料枠が無いため導入を見送っています（ADR 0003参照）。AI_PROVIDER=geminiを使用してください。",
    );
  }
}

export class ClaudeLlmClient implements LlmClient {
  completeStructured<T>(): Promise<T> {
    throw new Error(
      "ClaudeLlmClientは未実装です。Claude APIには恒久的な無料枠が無いため導入を見送っています（ADR 0003参照）。AI_PROVIDER=geminiを使用してください。",
    );
  }

  streamChat(): AsyncIterable<string> {
    throw new Error(
      "ClaudeLlmClientは未実装です。Claude APIには恒久的な無料枠が無いため導入を見送っています（ADR 0003参照）。AI_PROVIDER=geminiを使用してください。",
    );
  }
}
