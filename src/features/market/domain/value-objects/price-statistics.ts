import { DomainError } from "@/shared/domain/errors/domain-error";
import { Money } from "@/shared/domain/value-objects/money";

export class EmptyPriceListError extends DomainError {
  readonly code = "EMPTY_PRICE_LIST";

  constructor() {
    super("価格が1件も無いため統計量を算出できません");
  }
}

// 線形補間法（numpyのデフォルトと同じ方式）でパーセンタイルを求める。sortedは昇順ソート済みであること。
function percentile(sorted: number[], ratio: number): number {
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// IQR法（四分位範囲の1.5倍を超える値を外れ値とする）で外れ値を除去した価格群の統計量。不変・値による等価性を持つ値オブジェクト。
export class PriceStatistics {
  private constructor(
    readonly median: Money,
    readonly average: Money,
    readonly q1: Money,
    readonly q3: Money,
    readonly sampleSize: number,
  ) {}

  static calculate(prices: Money[]): PriceStatistics {
    if (prices.length === 0) {
      throw new EmptyPriceListError();
    }

    const sortedYen = prices.map((price) => Number(price.yen)).sort((a, b) => a - b);
    const rawQ1 = percentile(sortedYen, 0.25);
    const rawQ3 = percentile(sortedYen, 0.75);
    const iqr = rawQ3 - rawQ1;
    const lowerBound = rawQ1 - 1.5 * iqr;
    const upperBound = rawQ3 + 1.5 * iqr;

    const filtered = sortedYen.filter((yen) => yen >= lowerBound && yen <= upperBound);

    const median = percentile(filtered, 0.5);
    const average = filtered.reduce((sum, yen) => sum + yen, 0) / filtered.length;
    const q1 = percentile(filtered, 0.25);
    const q3 = percentile(filtered, 0.75);

    return new PriceStatistics(
      Money.fromYen(Math.round(median)),
      Money.fromYen(Math.round(average)),
      Money.fromYen(Math.round(q1)),
      Money.fromYen(Math.round(q3)),
      filtered.length,
    );
  }

  // 永続化済みの計算済み統計量からの復元用（Infrastructure層のRepositoryがDBの行から復元する際に使う）。
  // calculate()と異なり再計算は行わない。
  static reconstruct(median: Money, average: Money, q1: Money, q3: Money, sampleSize: number): PriceStatistics {
    return new PriceStatistics(median, average, q1, q3, sampleSize);
  }
}
