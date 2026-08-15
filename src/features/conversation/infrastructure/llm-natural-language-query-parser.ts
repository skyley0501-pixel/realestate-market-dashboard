import { z } from "zod";
import type { NaturalLanguageQueryParser, SearchCondition } from "../domain/services/natural-language-query-parser";
import type { LlmClient } from "./llm-client";

// 取引検索の物件種別（transaction/domain/constants/transaction-search-filters.tsのPROPERTY_TYPESと一致させる）
const PROPERTY_TYPES = ["中古マンション等", "宅地(土地と建物)", "宅地(土地)", "林地", "農地"];

const searchConditionSchema = z.object({
  municipalityName: z.string().nullable(),
  propertyType: z.string().nullable(),
  maxBuildingAgeYears: z.number().int().nonnegative().nullable(),
  minPriceYen: z.number().int().nonnegative().nullable(),
  maxPriceYen: z.number().int().nonnegative().nullable(),
});

function buildPrompt(query: string): string {
  return [
    "あなたは不動産検索の条件抽出アシスタントです。以下のユーザーの自然文検索クエリから、検索条件をJSONで抽出してください。",
    `ユーザーの入力: "${query}"`,
    "抽出するフィールド（言及が無い項目はnullにする）:",
    "- municipalityName: 市区町村名（例: 渋谷区）",
    `- propertyType: 物件種別。次のいずれかの文字列のみを使用: ${PROPERTY_TYPES.join(" / ")}`,
    "- maxBuildingAgeYears: 築年数の上限（例: 「築10年以内」→10）",
    "- minPriceYen: 価格帯の下限（円）。「5000万円台」なら50000000",
    "- maxPriceYen: 価格帯の上限（円）。「5000万円台」なら59999999",
  ].join("\n");
}

export class LlmNaturalLanguageQueryParser implements NaturalLanguageQueryParser {
  constructor(private readonly llmClient: LlmClient) {}

  async parse(query: string): Promise<SearchCondition> {
    return this.llmClient.completeStructured(buildPrompt(query), searchConditionSchema);
  }
}
