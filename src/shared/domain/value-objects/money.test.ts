import { describe, expect, it } from "vitest";
import { InvalidMoneyAmountError, Money } from "./money";

describe("Money", () => {
  it("加算した結果が正しい", () => {
    const total = Money.fromYen(1000).add(Money.fromYen(2500));
    expect(total.yen).toBe(3500n);
  });

  it("除算の端数を四捨五入して整数円に丸める", () => {
    const average = Money.fromYen(1000).divide(3);
    expect(average.yen).toBe(333n);
  });

  it("四捨五入で切り上がるケースも正しく丸める", () => {
    const average = Money.fromYen(10).divide(3);
    expect(average.yen).toBe(3n);
    const roundUp = Money.fromYen(2).divide(3);
    expect(roundUp.yen).toBe(1n);
  });

  it("同額のMoney同士はequalsでtrueになる", () => {
    expect(Money.fromYen(500).equals(Money.fromYen(500))).toBe(true);
    expect(Money.fromYen(500).equals(Money.fromYen(501))).toBe(false);
  });

  it("大小比較ができる", () => {
    expect(Money.fromYen(100).compareTo(Money.fromYen(200))).toBe(-1);
    expect(Money.fromYen(200).compareTo(Money.fromYen(100))).toBe(1);
    expect(Money.fromYen(100).compareTo(Money.fromYen(100))).toBe(0);
  });

  it("負の金額はInvalidMoneyAmountErrorを投げる", () => {
    expect(() => Money.fromYen(-1)).toThrow(InvalidMoneyAmountError);
  });

  it("非整数の金額はInvalidMoneyAmountErrorを投げる", () => {
    expect(() => Money.fromYen(1.5)).toThrow(InvalidMoneyAmountError);
  });

  it("0除算はInvalidMoneyAmountErrorを投げる", () => {
    expect(() => Money.fromYen(100).divide(0)).toThrow(InvalidMoneyAmountError);
  });
});
