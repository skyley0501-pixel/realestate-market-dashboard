import { describe, expect, it } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { InvalidAreaError, UnitPrice } from "./unit-price";

describe("UnitPrice", () => {
  it("総額と面積から㎡単価を算出する", () => {
    const unitPrice = UnitPrice.fromTotal(Money.fromYen(30_000_000), 60);
    expect(unitPrice.perSqm).toBe(500_000);
  });

  it("坪単価に換算する（1坪=3.30578㎡）", () => {
    const unitPrice = UnitPrice.fromTotal(Money.fromYen(30_000_000), 60);
    expect(unitPrice.toTsubo()).toBeCloseTo(500_000 * 3.30578, 5);
  });

  it("面積が0以下の場合はInvalidAreaErrorを投げる", () => {
    expect(() => UnitPrice.fromTotal(Money.fromYen(1000), 0)).toThrow(InvalidAreaError);
    expect(() => UnitPrice.fromTotal(Money.fromYen(1000), -10)).toThrow(InvalidAreaError);
  });
});
