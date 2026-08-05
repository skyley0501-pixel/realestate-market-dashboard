import type { TrendSeries } from "@/shared/ui/components/charts/TrendComparisonChart";
import type { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { toAreaSnapshotDto } from "../mappers/area-snapshot.mapper";

export function groupByArea(history: AreaMarketSnapshot[]): TrendSeries[] {
  const seriesByCode = new Map<string, TrendSeries>();
  for (const snapshot of history) {
    const dto = toAreaSnapshotDto(snapshot);
    const point = { period: dto.period, medianPriceYen: Number(dto.medianPriceYen) };
    const existing = seriesByCode.get(dto.code);
    if (existing) {
      existing.points.push(point);
    } else {
      seriesByCode.set(dto.code, {
        code: dto.code,
        label: `${dto.prefectureName}${dto.name}`,
        points: [point],
      });
    }
  }
  return [...seriesByCode.values()];
}
