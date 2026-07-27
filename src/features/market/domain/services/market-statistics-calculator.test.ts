import { describe, expect, it } from "vitest";
import { BuildingAge } from "@/features/transaction/domain/value-objects/building-age";
import { Transaction } from "@/features/transaction/domain/entities/transaction";
import { Money } from "@/shared/domain/value-objects/money";
import { Area } from "../entities/area";
import { PriceStatistics } from "../value-objects/price-statistics";
import { MarketStatisticsCalculator } from "./market-statistics-calculator";

function createTransaction(priceYen: number): Transaction {
  return Transaction.create({
    id: crypto.randomUUID(),
    municipalityCode: "13101",
    stationId: null,
    transactionPeriod: "2025Q3",
    propertyType: "中古マンション等",
    price: Money.fromYen(priceYen),
    areaSqm: 60,
    floorPlan: null,
    buildingAge: BuildingAge.fromBuildingYear(null),
    structure: null,
    use: null,
    remarks: null,
  });
}

describe("MarketStatisticsCalculator", () => {
  const calculator = new MarketStatisticsCalculator();
  const area = Area.create({
    code: "13101",
    name: "千代田区",
    prefectureCode: "13",
    prefectureName: "東京都",
  });

  it("前期データが無い場合、trendRateはnullのスナップショットを作る", () => {
    const transactions = [48_000_000, 49_000_000, 50_000_000, 51_000_000, 52_000_000].map(createTransaction);

    const snapshot = calculator.calculateSnapshot(area, transactions, "2025Q3");

    expect(snapshot.area.equals(area)).toBe(true);
    expect(snapshot.period).toBe("2025Q3");
    expect(snapshot.statistics.median.yen).toBe(50_000_000n);
    expect(snapshot.trendRate).toBeNull();
    expect(snapshot.transactionCount).toBe(5);
    // 平均価格50,000,000円 / 面積60㎡
    expect(snapshot.avgUnitPriceYenPerSqm).toBeCloseTo(50_000_000 / 60, 3);
  });

  it("前期の統計量を渡すと前年（前期）同期比を算出する", () => {
    const currentTransactions = [48_000_000, 49_000_000, 50_000_000, 51_000_000, 52_000_000].map(createTransaction);
    const previousStatistics = PriceStatistics.calculate(
      [44_000_000, 45_000_000, 45_000_000, 46_000_000, 47_000_000].map((yen) => Money.fromYen(yen)),
    );

    const snapshot = calculator.calculateSnapshot(area, currentTransactions, "2025Q3", previousStatistics);

    expect(snapshot.statistics.median.yen).toBe(50_000_000n);
    expect(previousStatistics.median.yen).toBe(45_000_000n);
    // (5000万 - 4500万) / 4500万 * 100
    expect(snapshot.trendRate?.percent).toBeCloseTo(11.111, 3);
    expect(snapshot.trendRate?.isIncrease).toBe(true);
  });

  it("calculateTrendRateは中央値を基準に前期比を直接算出できる", () => {
    const current = PriceStatistics.calculate([40_000_000, 40_000_000, 40_000_000].map((yen) => Money.fromYen(yen)));
    const previous = PriceStatistics.calculate([50_000_000, 50_000_000, 50_000_000].map((yen) => Money.fromYen(yen)));

    const trendRate = calculator.calculateTrendRate(current, previous);

    expect(trendRate.percent).toBeCloseTo(-20, 5);
    expect(trendRate.isDecrease).toBe(true);
  });
});
