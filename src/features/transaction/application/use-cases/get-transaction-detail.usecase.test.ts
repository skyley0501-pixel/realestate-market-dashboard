import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import { Transaction } from "../../domain/entities/transaction";
import type { TransactionRepository } from "../../domain/repositories/transaction-repository";
import { BuildingAge } from "../../domain/value-objects/building-age";
import { FloorPlan } from "../../domain/value-objects/floor-plan";
import { GetTransactionDetailUseCase } from "./get-transaction-detail.usecase";

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

describe("GetTransactionDetailUseCase", () => {
  it("正常系: 該当するTransactionを返す", async () => {
    const transaction = buildTransaction("txn-1");
    const repository = buildMockRepository({
      findById: vi.fn().mockResolvedValue(transaction),
    });
    const useCase = new GetTransactionDetailUseCase(repository);

    const result = await useCase.execute({ id: "txn-1" });

    result.match(
      (value) => expect(value.id).toBe("txn-1"),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(repository.findById).toHaveBeenCalledWith("txn-1");
  });

  it("存在しないIDの場合はTRANSACTION_NOT_FOUNDのResult.errを返す", async () => {
    const repository = buildMockRepository({ findById: vi.fn().mockResolvedValue(null) });
    const useCase = new GetTransactionDetailUseCase(repository);

    const result = await useCase.execute({ id: "not-exist" });

    expect(result.isOk).toBe(false);
    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TRANSACTION_NOT_FOUND"),
    );
  });

  it("Repositoryが例外を投げた場合はTRANSACTION_DETAIL_FAILEDのResult.errを返す", async () => {
    const repository = buildMockRepository({
      findById: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new GetTransactionDetailUseCase(repository);

    const result = await useCase.execute({ id: "txn-1" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("TRANSACTION_DETAIL_FAILED"),
    );
  });
});
