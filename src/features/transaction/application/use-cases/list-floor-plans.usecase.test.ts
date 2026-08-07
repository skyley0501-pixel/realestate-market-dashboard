import { describe, expect, it, vi } from "vitest";
import type { TransactionRepository } from "../../domain/repositories/transaction-repository";
import { ListFloorPlansUseCase } from "./list-floor-plans.usecase";

function buildMockRepository(overrides: Partial<TransactionRepository> = {}): TransactionRepository {
  return {
    findById: vi.fn(),
    search: vi.fn(),
    count: vi.fn(),
    findDistinctFloorPlans: vi.fn(),
    ...overrides,
  };
}

describe("ListFloorPlansUseCase", () => {
  it("正常系: リポジトリの間取り一覧をそのまま返す", async () => {
    const floorPlans = ["３ＬＤＫ", "２ＬＤＫ", "１Ｋ"];
    const repository = buildMockRepository({
      findDistinctFloorPlans: vi.fn().mockResolvedValue(floorPlans),
    });
    const useCase = new ListFloorPlansUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (value) => expect(value).toEqual(floorPlans),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("0件時: 空配列をそのまま返す（エラーにはしない）", async () => {
    const repository = buildMockRepository({
      findDistinctFloorPlans: vi.fn().mockResolvedValue([]),
    });
    const useCase = new ListFloorPlansUseCase(repository);

    const result = await useCase.execute();

    result.match(
      (value) => expect(value).toEqual([]),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("Repositoryが例外を投げた場合はFLOOR_PLAN_LIST_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findDistinctFloorPlans: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new ListFloorPlansUseCase(repository);

    const result = await useCase.execute();

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("FLOOR_PLAN_LIST_FAILED"),
    );
  });
});
