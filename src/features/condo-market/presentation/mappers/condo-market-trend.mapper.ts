import type { CondoMarketTrend } from "../../application/use-cases/get-condo-market-trend.usecase";
import type { CondoMarketStat } from "../../domain/entities/condo-market-stat";
import type { CondoSupply } from "../../domain/entities/condo-supply";

export interface CondoSupplyDto {
  prefectureCode: string;
  prefectureName: string;
  fiscalYear: number;
  unitsStarted: number;
}

export interface CondoMarketStatDto {
  prefectureCode: string;
  prefectureName: string;
  period: string;
  medianPriceYen: number;
  averagePriceYen: number;
  sampleSize: number;
  transactionCount: number;
}

export interface CondoMarketTrendDto {
  condoSupply: CondoSupplyDto[];
  condoMarketStats: CondoMarketStatDto[];
}

function toCondoSupplyDto(supply: CondoSupply): CondoSupplyDto {
  return {
    prefectureCode: supply.prefectureCode,
    prefectureName: supply.prefectureName,
    fiscalYear: supply.fiscalYear,
    unitsStarted: supply.unitsStarted,
  };
}

function toCondoMarketStatDto(stat: CondoMarketStat): CondoMarketStatDto {
  return {
    prefectureCode: stat.prefectureCode,
    prefectureName: stat.prefectureName,
    period: stat.period,
    medianPriceYen: Number(stat.medianPrice.yen),
    averagePriceYen: Number(stat.averagePrice.yen),
    sampleSize: stat.sampleSize,
    transactionCount: stat.transactionCount,
  };
}

export function toCondoMarketTrendDto(trend: CondoMarketTrend): CondoMarketTrendDto {
  return {
    condoSupply: trend.condoSupply.map(toCondoSupplyDto),
    condoMarketStats: trend.condoMarketStats.map(toCondoMarketStatDto),
  };
}
