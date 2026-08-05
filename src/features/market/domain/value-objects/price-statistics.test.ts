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

  it("価格が1件のみの場合、その値自体が外れ値扱いされず統計量として使われる", () => {
    const stats = PriceStatistics.calculate([yen(100)]);

    expect(stats.sampleSize).toBe(1);
    expect(stats.median.yen).toBe(100n);
    expect(stats.average.yen).toBe(100n);
    expect(stats.q1.yen).toBe(100n);
    expect(stats.q3.yen).toBe(100n);
  });

  it("価格が2件の場合、IQRが定義でき両方とも外れ値扱いされない", () => {
    const stats = PriceStatistics.calculate([100, 200].map(yen));

    expect(stats.sampleSize).toBe(2);
  });

  it("全て同一価格の場合、IQRが0になり全件が統計量の算出に使われる", () => {
    const stats = PriceStatistics.calculate([50, 50, 50, 50, 50].map(yen));

    expect(stats.sampleSize).toBe(5);
    expect(stats.median.yen).toBe(50n);
    expect(stats.average.yen).toBe(50n);
  });

  it("下限方向の外れ値も上限方向と同様に除去される", () => {
    // 1は下限側の外れ値（IQR法により36.5未満が除外対象になる組み合わせ）
    const prices = [1, 40, 41, 42, 43, 44].map(yen);
    const stats = PriceStatistics.calculate(prices);

    expect(stats.sampleSize).toBe(5);
    expect(stats.q1.yen).not.toBe(1n);
  });

  it("上限・下限の両方に外れ値がある場合、両方とも除去される", () => {
    const prices = [1, 40, 41, 42, 43, 44, 1000].map(yen);
    const stats = PriceStatistics.calculate(prices);

    expect(stats.sampleSize).toBe(5);
    expect(stats.median.yen).toBe(42n);
  });

  it("大量データ（1万件）でも外れ値除去を含む統計量を正しく算出できる", () => {
    // 大半は3000万〜7000万円のレンジ、末尾に極端な外れ値を混入させる
    const normalPrices = Array.from({ length: 9990 }, (_, i) => 30_000_000 + (i % 4000) * 10_000);
    const outliers = Array.from({ length: 10 }, () => 5_000_000_000);
    const prices = [...normalPrices, ...outliers].map(yen);

    const start = performance.now();
    const stats = PriceStatistics.calculate(prices);
    const elapsedMs = performance.now() - start;

    expect(stats.sampleSize).toBeLessThan(prices.length); // 外れ値10件が除去されているはず
    expect(stats.sampleSize).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(1000); // 1万件のソート+パーセンタイル計算が1秒を大きく超えないことを確認
  });
});
