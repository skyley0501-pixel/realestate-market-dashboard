import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { MunicipalityOption, MunicipalityRepository } from "../../domain/repositories/municipality-repository";

export interface ListMunicipalitiesInput {
  prefectureCode: string;
}

export class ListMunicipalitiesUseCase {
  constructor(private readonly municipalityRepository: MunicipalityRepository) {}

  async execute(input: ListMunicipalitiesInput): Promise<Result<MunicipalityOption[], ApplicationError>> {
    if (!input.prefectureCode) {
      return Result.err(
        new ApplicationError(
          "MUNICIPALITY_INVALID_PREFECTURE_CODE",
          "prefectureCodeは必須です",
          "都道府県を選択してください。",
        ),
      );
    }

    try {
      const municipalities = await this.municipalityRepository.findByPrefectureCode(input.prefectureCode);
      return Result.ok(municipalities);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "MUNICIPALITY_LIST_FAILED",
          `市区町村一覧の取得に失敗しました: ${String(error)}`,
          "市区町村一覧の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
