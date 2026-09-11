import type { ReinsAreaHistory, ReinsReport } from "../../application/use-cases/get-reins-report.usecase";
import type { ReinsMarketStat, ReinsPropertyType, ReinsRegion } from "../../domain/entities/reins-market-stat";

export interface ReinsMarketStatDto {
  period: string; // "YYYY-MM"
  region: ReinsRegion;
  propertyType: ReinsPropertyType;
  contractCount: number;
  contractUnitPriceManYen: number | null;
  contractPriceManYen: number | null;
  newListingUnitPriceManYen: number | null;
  inventoryCount: number | null;
}

export interface ReinsAreaHistoryDto {
  region: ReinsRegion;
  history: ReinsMarketStatDto[];
}

export interface ReinsReportDto {
  metroCondoHistory: ReinsMarketStatDto[];
  metroDetachedHistory: ReinsMarketStatDto[];
  areaCondoHistories: ReinsAreaHistoryDto[];
}

function toDto(stat: ReinsMarketStat): ReinsMarketStatDto {
  return {
    period: stat.period,
    region: stat.region,
    propertyType: stat.propertyType,
    contractCount: stat.contractCount,
    contractUnitPriceManYen: stat.contractUnitPriceManYen,
    contractPriceManYen: stat.contractPriceManYen,
    newListingUnitPriceManYen: stat.newListingUnitPriceManYen,
    inventoryCount: stat.inventoryCount,
  };
}

function toAreaHistoryDto(areaHistory: ReinsAreaHistory): ReinsAreaHistoryDto {
  return { region: areaHistory.region, history: areaHistory.history.map(toDto) };
}

export function toReinsReportDto(report: ReinsReport): ReinsReportDto {
  return {
    metroCondoHistory: report.metroCondoHistory.map(toDto),
    metroDetachedHistory: report.metroDetachedHistory.map(toDto),
    areaCondoHistories: report.areaCondoHistories.map(toAreaHistoryDto),
  };
}

// "YYYY-MM" -> "YYYY年M月"
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  return `${year}年${Number(month)}月`;
}

// 直近と12ヶ月前（同じ月のインデックス差）を比較して前年同月比（%、小数1位）を返す。データが無ければnull
export function yoyChangePercent(history: ReinsMarketStatDto[], valueOf: (d: ReinsMarketStatDto) => number | null) {
  if (history.length < 13) return null;
  const latest = history[history.length - 1];
  const yearAgo = history[history.length - 13];
  const latestValue = valueOf(latest);
  const yearAgoValue = valueOf(yearAgo);
  if (latestValue === null || yearAgoValue === null || yearAgoValue === 0) return null;
  return Math.round(((latestValue - yearAgoValue) / yearAgoValue) * 1000) / 10;
}

export function yoyColorClass(yoyPercent: number | null): string {
  if (yoyPercent === null) return "text-muted-foreground";
  if (yoyPercent > 0) return "text-emerald-600";
  if (yoyPercent < 0) return "text-red-600";
  return "text-muted-foreground";
}

export function formatYoyText(yoyPercent: number | null): string {
  if (yoyPercent === null) return "-";
  const sign = yoyPercent > 0 ? "+" : "";
  return `${sign}${yoyPercent.toFixed(1)}%`;
}
