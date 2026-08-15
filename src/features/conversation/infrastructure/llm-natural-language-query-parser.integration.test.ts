import "dotenv/config";
import { describe, expect, it } from "vitest";
import { GeminiLlmClient } from "./llm-client";
import { LlmNaturalLanguageQueryParser } from "./llm-natural-language-query-parser";

// 実際のGemini APIに対する結合テスト。GEMINI_API_KEYが.envに必要（無料枠のFlashモデルを使用）。
describe("LlmNaturalLanguageQueryParser (integration)", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEYが設定されていません。.envを確認してください。");
  }
  const parser = new LlmNaturalLanguageQueryParser(new GeminiLlmClient(apiKey));

  it("「渋谷区で築10年以内5000万円台」を正しい検索条件JSONに変換する", async () => {
    const result = await parser.parse("渋谷区で築10年以内5000万円台の物件を探しています");

    expect(result.municipalityName).toBe("渋谷区");
    expect(result.maxBuildingAgeYears).toBe(10);
    expect(result.minPriceYen).toBe(50_000_000);
    expect(result.maxPriceYen).toBeGreaterThanOrEqual(50_000_000);
    expect(result.maxPriceYen).toBeLessThan(60_000_000);
  }, 30_000);

  it("条件の言及が無い項目はnullになる", async () => {
    const result = await parser.parse("港区の中古マンションを見たい");

    expect(result.municipalityName).toBe("港区");
    expect(result.propertyType).toBe("中古マンション等");
    expect(result.maxBuildingAgeYears).toBeNull();
    expect(result.minPriceYen).toBeNull();
  }, 30_000);
});
