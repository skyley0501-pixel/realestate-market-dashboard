const SQM_PER_TSUBO = 3.30578;

export function formatYen(priceYen: string | number): string {
  return `${BigInt(Math.round(Number(priceYen))).toLocaleString("ja-JP")}円`;
}

export function formatTsuboPrice(avgUnitPriceYenPerSqm: number): string {
  return `${Math.round(avgUnitPriceYenPerSqm * SQM_PER_TSUBO).toLocaleString("ja-JP")}円/坪`;
}

export function trendColorClass(trendRatePercent: number | null): string {
  if (trendRatePercent === null) return "text-muted-foreground";
  if (trendRatePercent > 0) return "text-emerald-600";
  if (trendRatePercent < 0) return "text-red-600";
  return "text-muted-foreground";
}

export function formatTrendText(trendRatePercent: number | null): string {
  if (trendRatePercent === null) return "-";
  const sign = trendRatePercent > 0 ? "+" : "";
  return `${sign}${trendRatePercent.toFixed(1)}%`;
}

const QUARTER_MONTH_RANGES: Record<string, string> = {
  "1": "1〜3月",
  "2": "4〜6月",
  "3": "7〜9月",
  "4": "10〜12月",
};

// "2026Q1" -> "2026年1〜3月期"
export function formatPeriodLabel(period: string): string {
  const match = period.match(/^(\d{4})Q([1-4])$/);
  if (!match) return period;
  const [, year, quarter] = match;
  return `${year}年${QUARTER_MONTH_RANGES[quarter]}期`;
}
