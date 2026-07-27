import { DomainError } from "@/shared/domain/errors/domain-error";
import { Money } from "@/shared/domain/value-objects/money";

const SQM_PER_TSUBO = 3.30578;

export class InvalidUnitPriceError extends DomainError {
  readonly code = "INVALID_UNIT_PRICE";

  constructor(yenPerSqm: unknown) {
    super(`不正な坪単価です: ${String(yenPerSqm)}`);
  }
}

export class InvalidAreaError extends DomainError {
  readonly code = "INVALID_AREA";

  constructor(areaSqm: unknown) {
    super(`不正な面積です: ${String(areaSqm)}`);
  }
}

// 1㎡あたりの価格を表す値オブジェクト。坪単価（1坪=3.30578㎡）への換算を提供する。
export class UnitPrice {
  private constructor(private readonly yenPerSqm: number) {
    if (!Number.isFinite(yenPerSqm) || yenPerSqm < 0) {
      throw new InvalidUnitPriceError(yenPerSqm);
    }
  }

  static fromTotal(price: Money, areaSqm: number): UnitPrice {
    if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
      throw new InvalidAreaError(areaSqm);
    }
    return new UnitPrice(Number(price.yen) / areaSqm);
  }

  get perSqm(): number {
    return this.yenPerSqm;
  }

  toTsubo(): number {
    return this.yenPerSqm * SQM_PER_TSUBO;
  }
}
