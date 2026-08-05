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
