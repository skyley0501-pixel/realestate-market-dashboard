import { DomainError } from "../errors/domain-error";

export class InvalidMoneyAmountError extends DomainError {
  readonly code = "INVALID_MONEY_AMOUNT";

  constructor(amount: unknown) {
    super(`不正な金額です: ${String(amount)}`);
  }
}

// 通貨計算の丸め誤差を避けるため、金額は常に整数円（bigint）で保持する値オブジェクト
export class Money {
  private constructor(private readonly amountYen: bigint) {}

  static fromYen(amount: number | bigint): Money {
    if (typeof amount === "number" && !Number.isInteger(amount)) {
      throw new InvalidMoneyAmountError(amount);
    }
    const yen = BigInt(amount);
    if (yen < 0n) {
      throw new InvalidMoneyAmountError(amount);
    }
    return new Money(yen);
  }

  static zero(): Money {
    return new Money(0n);
  }

  get yen(): bigint {
    return this.amountYen;
  }

  add(other: Money): Money {
    return new Money(this.amountYen + other.amountYen);
  }

  // 数量按分等で生じる端数は四捨五入して整数円に丸める
  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new InvalidMoneyAmountError(divisor);
    }
    const rounded = Math.round(Number(this.amountYen) / divisor);
    return Money.fromYen(rounded);
  }

  equals(other: Money): boolean {
    return this.amountYen === other.amountYen;
  }

  compareTo(other: Money): -1 | 0 | 1 {
    if (this.amountYen < other.amountYen) return -1;
    if (this.amountYen > other.amountYen) return 1;
    return 0;
  }

  toNumber(): number {
    return Number(this.amountYen);
  }
}
