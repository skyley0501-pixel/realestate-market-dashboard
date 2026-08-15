import type { MunicipalityRepository } from "@/features/transaction/domain/repositories/municipality-repository";
import { describe, expect, it, vi } from "vitest";
import type { NaturalLanguageQueryParser, SearchCondition } from "../../domain/services/natural-language-query-parser";
import { ParseNaturalLanguageSearchUseCase } from "./parse-natural-language-search.usecase";

function buildMockParser(overrides: Partial<NaturalLanguageQueryParser> = {}): NaturalLanguageQueryParser {
  return {
    parse: vi.fn(),
    ...overrides,
  };
}

function buildMockMunicipalityRepository(
  overrides: Partial<MunicipalityRepository> = {},
): MunicipalityRepository {
  return {
    findByPrefectureCode: vi.fn(),
    findByName: vi.fn(),
    ...overrides,
  };
}

function buildCondition(overrides: Partial<SearchCondition> = {}): SearchCondition {
  return {
    municipalityName: null,
    propertyType: null,
    maxBuildingAgeYears: null,
    minPriceYen: null,
    maxPriceYen: null,
    ...overrides,
  };
}

describe("ParseNaturalLanguageSearchUseCase", () => {
  it("正常系: 市区町村名をコードへ変換し、築年数を築年（西暦）に変換して返す", async () => {
    const parser = buildMockParser({
      parse: vi.fn().mockResolvedValue(
        buildCondition({
          municipalityName: "渋谷区",
          propertyType: "中古マンション等",
          maxBuildingAgeYears: 10,
          minPriceYen: 50_000_000,
          maxPriceYen: 59_999_999,
        }),
      ),
    });
    const municipalityRepository = buildMockMunicipalityRepository({
      findByName: vi.fn().mockResolvedValue({ code: "13113", name: "渋谷区" }),
    });
    const useCase = new ParseNaturalLanguageSearchUseCase(parser, municipalityRepository);
    const currentYear = new Date().getFullYear();

    const result = await useCase.execute({ query: "渋谷区で築10年以内5000万円台の中古マンション" });

    result.match(
      (value) =>
        expect(value).toEqual({
          municipalityCode: "13113",
          propertyType: "中古マンション等",
          minPrice: 50_000_000,
          maxPrice: 59_999_999,
          minBuildingYear: currentYear - 10,
        }),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("LLMが返した市区町村名が実在しない場合はエラーにせず、その条件だけ未指定にする", async () => {
    const parser = buildMockParser({
      parse: vi.fn().mockResolvedValue(buildCondition({ municipalityName: "存在しない区" })),
    });
    const municipalityRepository = buildMockMunicipalityRepository({
      findByName: vi.fn().mockResolvedValue(null),
    });
    const useCase = new ParseNaturalLanguageSearchUseCase(parser, municipalityRepository);

    const result = await useCase.execute({ query: "存在しない区の物件" });

    result.match(
      (value) => expect(value.municipalityCode).toBeUndefined(),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("市区町村名の言及が無い場合はfindByNameを呼ばない", async () => {
    const parser = buildMockParser({
      parse: vi.fn().mockResolvedValue(buildCondition({ minPriceYen: 30_000_000 })),
    });
    const municipalityRepository = buildMockMunicipalityRepository();
    const useCase = new ParseNaturalLanguageSearchUseCase(parser, municipalityRepository);

    await useCase.execute({ query: "3000万円以上の物件" });

    expect(municipalityRepository.findByName).not.toHaveBeenCalled();
  });

  it("パーサーが例外を投げた場合はNL_SEARCH_PARSE_FAILEDのResult.errを返す", async () => {
    const parser = buildMockParser({
      parse: vi.fn().mockRejectedValue(new Error("Gemini APIエラー")),
    });
    const municipalityRepository = buildMockMunicipalityRepository();
    const useCase = new ParseNaturalLanguageSearchUseCase(parser, municipalityRepository);

    const result = await useCase.execute({ query: "渋谷区の物件" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("NL_SEARCH_PARSE_FAILED"),
    );
  });
});
