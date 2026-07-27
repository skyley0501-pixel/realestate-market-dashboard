import { describe, expect, it } from "vitest";
import { Money } from "@/shared/domain/value-objects/money";
import { EmptyPriceListError, PriceStatistics } from "./price-statistics";

describe("PriceStatistics", () => {
  const yen = (n: number) => Money.fromYen(n);

  it("外れ値を除去した上で中央値・平均・四分位数を算出する", () => {
    const prices = [10, 20, 30, 40, 50, 1000].map(yen);
    const stats = PriceStatistics.calculate(prices);

    expect(stats.sampleSize).toBe(5); // 外れ値1000が除外される
    expect(stats.median.yen).toBe(30n);
    expect(stats.average.yen).toBe(30n);
    expect(stats.q1.yen).toBe(20n);
    expect(stats.q3.yen).toBe(40n);
  });

  it("外れ値が無ければ全件が統計量の算出に使われる", () => {
    const prices = [10, 20, 30, 40, 50].map(yen);
    const stats = PriceStatistics.calculate(prices);

    expect(stats.sampleSize).toBe(5);
    expect(stats.median.yen).toBe(30n);
  });

  it("価格が1件も無い場合はEmptyPriceListErrorを投げる", () => {
    expect(() => PriceStatistics.calculate([])).toThrow(EmptyPriceListError);
  });

  it("reconstructは再計算せず渡された値をそのまま保持する", () => {
    const stats = PriceStatistics.reconstruct(yen(30), yen(32), yen(20), yen(40), 5);

    expect(stats.median.yen).toBe(30n);
    expect(stats.average.yen).toBe(32n);
    expect(stats.q1.yen).toBe(20n);
    expect(stats.q3.yen).toBe(40n);
    expect(stats.sampleSize).toBe(5);
  });
});
