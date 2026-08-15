import { describe, expect, it, vi } from "vitest";
import type { LlmClient } from "./llm-client";
import { LlmNaturalLanguageQueryParser } from "./llm-natural-language-query-parser";

function buildMockLlmClient(overrides: Partial<LlmClient> = {}): LlmClient {
  return {
    completeStructured: vi.fn(),
    streamChat: vi.fn(),
    ...overrides,
  };
}

describe("LlmNaturalLanguageQueryParser", () => {
  it("LlmClientの構造化出力をそのままSearchConditionとして返す", async () => {
    const llmClient = buildMockLlmClient({
      completeStructured: vi.fn().mockResolvedValue({
        municipalityName: "渋谷区",
        propertyType: "中古マンション等",
        maxBuildingAgeYears: 10,
        minPriceYen: 50_000_000,
        maxPriceYen: 59_999_999,
      }),
    });
    const parser = new LlmNaturalLanguageQueryParser(llmClient);

    const result = await parser.parse("渋谷区で築10年以内5000万円台の中古マンションを探しています");

    expect(result).toEqual({
      municipalityName: "渋谷区",
      propertyType: "中古マンション等",
      maxBuildingAgeYears: 10,
      minPriceYen: 50_000_000,
      maxPriceYen: 59_999_999,
    });
    expect(llmClient.completeStructured).toHaveBeenCalledTimes(1);
  });

  it("条件が言及されていない項目はnullのまま返す", async () => {
    const llmClient = buildMockLlmClient({
      completeStructured: vi.fn().mockResolvedValue({
        municipalityName: "港区",
        propertyType: null,
        maxBuildingAgeYears: null,
        minPriceYen: null,
        maxPriceYen: null,
      }),
    });
    const parser = new LlmNaturalLanguageQueryParser(llmClient);

    const result = await parser.parse("港区の物件");

    expect(result.municipalityName).toBe("港区");
    expect(result.propertyType).toBeNull();
    expect(result.maxBuildingAgeYears).toBeNull();
  });
});
