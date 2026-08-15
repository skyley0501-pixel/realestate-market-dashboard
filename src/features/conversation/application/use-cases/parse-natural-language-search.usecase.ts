import type { MunicipalityRepository } from "@/features/transaction/domain/repositories/municipality-repository";
import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { NaturalLanguageQueryParser } from "../../domain/services/natural-language-query-parser";

export interface ParseNaturalLanguageSearchInput {
  query: string;
}

// /transactions のクエリパラメータにそのまま使える形の検索条件
export interface NaturalLanguageSearchResult {
  municipalityCode?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBuildingYear?: number;
}

export class ParseNaturalLanguageSearchUseCase {
  constructor(
    private readonly parser: NaturalLanguageQueryParser,
    private readonly municipalityRepository: MunicipalityRepository,
  ) {}

  async execute(
    input: ParseNaturalLanguageSearchInput,
  ): Promise<Result<NaturalLanguageSearchResult, ApplicationError>> {
    try {
      const condition = await this.parser.parse(input.query);

      // LLMが返す市区町村名はハルシネーションの可能性があるため、実在するマスタと突き合わせてからのみ使う。
      // 該当が無い場合はエラーにせず、その条件を単に指定しない（他の条件だけで検索結果を返す）
      const municipality = condition.municipalityName
        ? await this.municipalityRepository.findByName(condition.municipalityName)
        : null;

      const currentYear = new Date().getFullYear();
      const minBuildingYear =
        condition.maxBuildingAgeYears !== null ? currentYear - condition.maxBuildingAgeYears : undefined;

      return Result.ok({
        municipalityCode: municipality?.code,
        propertyType: condition.propertyType ?? undefined,
        minPrice: condition.minPriceYen ?? undefined,
        maxPrice: condition.maxPriceYen ?? undefined,
        minBuildingYear,
      });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "NL_SEARCH_PARSE_FAILED",
          `自然文検索の解析に失敗しました: ${String(error)}`,
          "検索条件の解析に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
