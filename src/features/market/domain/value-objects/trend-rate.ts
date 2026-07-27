import { DomainError } from "@/shared/domain/errors/domain-error";
import { Money } from "@/shared/domain/value-objects/money";

export class ZeroBasePriceError extends DomainError {
  readonly code = "ZERO_BASE_PRICE";

  constructor() {
    super("比較対象期間（前期）の価格が0円のため変化率を算出できません");
  }
}

// 前期と当期の価格を比較した変化率（前年同期比等）を表す値オブジェクト。
export class TrendRate {
  private constructor(private readonly ratePercent: number) {}

  static calculate(current: Money, previous: Money): TrendRate {
    if (previous.yen === 0n) {
      throw new ZeroBasePriceError();
    }
    const rate = (Number(current.yen - previous.yen) / Number(previous.yen)) * 100;
    return new TrendRate(rate);
  }

  get percent(): number {
    return this.ratePercent;
  }

  get isIncrease(): boolean {
    return this.ratePercent > 0;
  }

  get isDecrease(): boolean {
    return this.ratePercent < 0;
  }

  // 永続化済みの計算済み変化率からの復元用（Infrastructure層のRepositoryがDBの行から復元する際に使う）。
  static reconstruct(ratePercent: number): TrendRate {
    return new TrendRate(ratePercent);
  }
}
