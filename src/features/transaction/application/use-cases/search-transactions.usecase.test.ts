import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import { Transaction } from "../../domain/entities/transaction";
import type { TransactionRepository } from "../../domain/repositories/transaction-repository";
import { BuildingAge } from "../../domain/value-objects/building-age";
import { FloorPlan } from "../../domain/value-objects/floor-plan";
import { SearchTransactionsUseCase } from "./search-transactions.usecase";

function buildTransaction(id: string): Transaction {
  return Transaction.create({
    id,
    municipalityCode: "13113",
    stationId: null,
    transactionPeriod: "2015Q2",
    propertyType: "中古マンション等",
    price: Money.fromYen(50000000),
    areaSqm: 60,
    floorPlan: FloorPlan.fromLabel("2LDK"),
    buildingAge: BuildingAge.fromBuildingYear(2010, new Date("2025-06-01")),
    structure: null,
    use: null,
    remarks: null,
  });
}

function buildMockRepository(overrides: Partial<TransactionRepository> = {}): TransactionRepository {
  return {
    findById: vi.fn(),
    search: vi.fn(),
    count: vi.fn(),
    findDistinctFloorPlans: vi.fn(),
    ...overrides,
  };
}

describe("SearchTransactionsUseCase", () => {
  it("正常系: リポジトリの検索結果をそのまま返す", async () => {
    const transactions = [buildTransaction("txn-1"), buildTransaction("txn-2")];
    const repository = buildMockRepository({
      search: vi.fn().mockResolvedValue(transactions),
    });
    const useCase = new SearchTransactionsUseCase(repository);

    const result = await useCase.execute({ municipalityCode: "13113" });

    expect(result.isOk).toBe(true);
    result.match(
      (value) => expect(value).toHaveLength(2),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.search).toHaveBeenCalledWith({ municipalityCode: "13113" });
  });

  it("0件時: 空配列をそのまま返す", async () => {
    const repository = buildMockRepository({ search: vi.fn().mockResolvedValue([]) });
    const useCase = new SearchTransactionsUseCase(repository);

    const result = await useCase.execute({});

    result.match(
      (value) => expect(value).toEqual([]),
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("Repositoryが例外を投げた場合はResult.errを返す", async () => {
    const repository = buildMockRepository({
      search: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new SearchTransactionsUseCase(repository);

    const result = await useCase.execute({});

    expect(result.isOk).toBe(false);
    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TRANSACTION_SEARCH_FAILED"),
    );
  });
});
