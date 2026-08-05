import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaTrendSelector } from "@/features/market/presentation/components/AreaTrendSelector";
import { MIN_TREND_AREAS } from "@/features/market/presentation/lib/trend-selection";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import type { AreaMarketSnapshot } from "@/features/market/domain/aggregates/area-market-snapshot";
import { TrendComparisonChart, type TrendSeries } from "@/shared/ui/components/charts/TrendComparisonChart";

type SearchParams = Record<string, string | string[] | undefined>;

function parseCodes(value: string | string[] | undefined): string[] {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

function groupByArea(history: AreaMarketSnapshot[]): TrendSeries[] {
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

export default async function TrendsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const codes = parseCodes(params.codes);

  const areasResult = await marketContainer.getListAreasUseCase().execute();
  const areas = areasResult.match(
    (snapshots) => snapshots.map(toAreaSnapshotDto),
    () => [],
  );

  const trendsResult =
    codes.length >= MIN_TREND_AREAS ? await marketContainer.getTrendsUseCase().execute({ codes }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">トレンド分析</h1>

      <AreaTrendSelector areas={areas} selectedCodes={codes} />

      {trendsResult &&
        trendsResult.match(
          (history) => {
            const series = groupByArea(history);
            return series.length > 0 ? (
              <TrendComparisonChart series={series} />
            ) : (
              <p className="text-muted-foreground">選択したエリアのデータがまだありません。</p>
            );
          },
          (error) => <p className="text-destructive">{error.userMessage}</p>,
        )}
    </div>
  );
}
