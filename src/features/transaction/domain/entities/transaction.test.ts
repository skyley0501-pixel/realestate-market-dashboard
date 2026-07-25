import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it } from "vitest";
import { BuildingAge } from "../value-objects/building-age";
import { FloorPlan } from "../value-objects/floor-plan";
import { InvalidTransactionAreaError, Transaction } from "./transaction";

function buildProps(overrides: Partial<Parameters<typeof Transaction.create>[0]> = {}) {
  return {
    id: "txn-1",
    municipalityCode: "13113",
    stationId: null,
    transactionPeriod: "2015Q2",
    propertyType: "中古マンション等",
    price: Money.fromYen(85000000),
    areaSqm: 70,
    floorPlan: FloorPlan.fromLabel("3LDK"),
    buildingAge: BuildingAge.fromBuildingYear(2005, new Date("2025-06-01")),
    structure: "RC",
    use: "住宅",
    remarks: null,
    ...overrides,
  };
}

describe("Transaction", () => {
  it("正常な属性でEntityを生成できる", () => {
    const transaction = Transaction.create(buildProps());
    expect(transaction.id).toBe("txn-1");
    expect(transaction.price.yen).toBe(85000000n);
    expect(transaction.floorPlan?.toString()).toBe("3LDK");
  });

  it("平米単価を算出できる", () => {
    const transaction = Transaction.create(
      buildProps({ price: Money.fromYen(70000000), areaSqm: 70 }),
    );
    expect(transaction.unitPricePerSqm().yen).toBe(1000000n);
  });

  it("面積が0以下の場合はInvalidTransactionAreaErrorを投げる", () => {
    expect(() => Transaction.create(buildProps({ areaSqm: 0 }))).toThrow(
      InvalidTransactionAreaError,
    );
    expect(() => Transaction.create(buildProps({ areaSqm: -10 }))).toThrow(
      InvalidTransactionAreaError,
    );
  });

  it("同一idのTransaction同士はequalsでtrueになる", () => {
    const a = Transaction.create(buildProps({ id: "txn-1" }));
    const b = Transaction.create(buildProps({ id: "txn-1", price: Money.fromYen(1) }));
    const c = Transaction.create(buildProps({ id: "txn-2" }));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
