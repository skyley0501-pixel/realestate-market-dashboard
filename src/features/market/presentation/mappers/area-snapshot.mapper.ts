import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";

// JSON.stringifyはbigintを扱えないため、金額は文字列として返す
export interface AreaSnapshotDto {
  code: string;
  name: string;
  prefectureCode: string;
  prefectureName: string;
  period: string;
  medianPriceYen: string;
  averagePriceYen: string;
  q1PriceYen: string;
  q3PriceYen: string;
  sampleSize: number;
  trendRatePercent: number | null;
  avgUnitPriceYenPerSqm: number;
  transactionCount: number;
}

export function toAreaSnapshotDto(snapshot: AreaMarketSnapshot): AreaSnapshotDto {
  return {
    code: snapshot.area.code,
    name: snapshot.area.name,
    prefectureCode: snapshot.area.prefectureCode,
    prefectureName: snapshot.area.prefectureName,
    period: snapshot.period,
    medianPriceYen: snapshot.statistics.median.yen.toString(),
    averagePriceYen: snapshot.statistics.average.yen.toString(),
    q1PriceYen: snapshot.statistics.q1.yen.toString(),
    q3PriceYen: snapshot.statistics.q3.yen.toString(),
    sampleSize: snapshot.statistics.sampleSize,
    trendRatePercent: snapshot.trendRate?.percent ?? null,
    avgUnitPriceYenPerSqm: snapshot.avgUnitPriceYenPerSqm,
    transactionCount: snapshot.transactionCount,
  };
}
