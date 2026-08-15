// LLM抽出結果。市区町村名等は自然文由来の文字列のまま返す（コードへの変換や存在確認は
// 呼び出し側のUseCaseがMunicipalityRepository等を使って行う。LLMにコード生成をさせない）。
export interface SearchCondition {
  municipalityName: string | null;
  propertyType: string | null;
  maxBuildingAgeYears: number | null;
  minPriceYen: number | null;
  maxPriceYen: number | null;
}

// 実装はLLM呼び出し（infrastructure/llm-natural-language-query-parser.ts）
export interface NaturalLanguageQueryParser {
  parse(query: string): Promise<SearchCondition>;
}
