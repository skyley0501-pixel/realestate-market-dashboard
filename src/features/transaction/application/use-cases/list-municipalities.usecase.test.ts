import { describe, expect, it, vi } from "vitest";
import type { MunicipalityRepository } from "../../domain/repositories/municipality-repository";
import { ListMunicipalitiesUseCase } from "./list-municipalities.usecase";

function buildMockRepository(overrides: Partial<MunicipalityRepository> = {}): MunicipalityRepository {
  return {
    findByPrefectureCode: vi.fn(),
    ...overrides,
  };
}

describe("ListMunicipalitiesUseCase", () => {
  it("正常系: 指定した都道府県コードの市区町村一覧を返す", async () => {
    const municipalities = [
      { code: "13101", name: "千代田区" },
      { code: "13102", name: "中央区" },
    ];
    const repository = buildMockRepository({
      findByPrefectureCode: vi.fn().mockResolvedValue(municipalities),
    });
    const useCase = new ListMunicipalitiesUseCase(repository);

    const result = await useCase.execute({ prefectureCode: "13" });

    result.match(
      (value) => expect(value).toEqual(municipalities),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findByPrefectureCode).toHaveBeenCalledWith("13");
  });

  it("該当データが無い都道府県コードの場合は空配列を返す（エラーにはしない）", async () => {
    const repository = buildMockRepository({
      findByPrefectureCode: vi.fn().mockResolvedValue([]),
    });
    const useCase = new ListMunicipalitiesUseCase(repository);

    const result = await useCase.execute({ prefectureCode: "14" });

    result.match(
      (value) => expect(value).toEqual([]),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("prefectureCodeが空文字の場合はMUNICIPALITY_INVALID_PREFECTURE_CODEのResult.errを返す", async () => {
    const repository = buildMockRepository();
    const useCase = new ListMunicipalitiesUseCase(repository);

    const result = await useCase.execute({ prefectureCode: "" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("MUNICIPALITY_INVALID_PREFECTURE_CODE"),
    );
    expect(repository.findByPrefectureCode).not.toHaveBeenCalled();
  });

  it("Repositoryが例外を投げた場合はMUNICIPALITY_LIST_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findByPrefectureCode: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new ListMunicipalitiesUseCase(repository);

    const result = await useCase.execute({ prefectureCode: "13" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("MUNICIPALITY_LIST_FAILED"),
    );
  });
});
