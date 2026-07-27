import { describe, expect, it } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { TrendRate, ZeroBasePriceError } from "./trend-rate";

describe("TrendRate", () => {
  it("前期より上昇した場合、正の変化率を算出する", () => {
    const rate = TrendRate.calculate(Money.fromYen(50_000_000), Money.fromYen(45_000_000));
    expect(rate.percent).toBeCloseTo(11.111, 3);
    expect(rate.isIncrease).toBe(true);
    expect(rate.isDecrease).toBe(false);
  });

  it("前期より下落した場合、負の変化率を算出する", () => {
    const rate = TrendRate.calculate(Money.fromYen(40_000_000), Money.fromYen(50_000_000));
    expect(rate.percent).toBeCloseTo(-20, 5);
    expect(rate.isDecrease).toBe(true);
    expect(rate.isIncrease).toBe(false);
  });

  it("前期と変化が無ければ変化率は0", () => {
    const rate = TrendRate.calculate(Money.fromYen(30_000_000), Money.fromYen(30_000_000));
    expect(rate.percent).toBe(0);
  });

  it("前期の価格が0円の場合はZeroBasePriceErrorを投げる", () => {
    expect(() => TrendRate.calculate(Money.fromYen(1000), Money.fromYen(0))).toThrow(ZeroBasePriceError);
  });

  it("reconstructは渡された変化率をそのまま保持する", () => {
    const rate = TrendRate.reconstruct(-5.5);
    expect(rate.percent).toBe(-5.5);
    expect(rate.isDecrease).toBe(true);
  });
});
