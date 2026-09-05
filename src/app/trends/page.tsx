import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaMultiSelector } from "@/features/market/presentation/components/AreaMultiSelector";
import { groupByArea } from "@/features/market/presentation/lib/trend-grouping";
import { parseCodesParam, type SearchParams } from "@/features/market/presentation/lib/search-params";
import { MAX_TREND_AREAS, MIN_TREND_AREAS } from "@/features/market/presentation/lib/trend-selection";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import { TrendComparisonChart } from "@/shared/ui/components/charts/TrendComparisonChart";

export default async function TrendsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const codes = parseCodesParam(params.codes);

  const areasResult = await marketContainer.getListAreasUseCase().execute();
  const areas = areasResult.match(
    (snapshots) => snapshots.map(toAreaSnapshotDto),
    () => [],
  );

  const trendsResult =
    codes.length >= MIN_TREND_AREAS ? await marketContainer.getTrendsUseCase().execute({ codes }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">エリア比較</h1>

      <AreaMultiSelector areas={areas} selectedCodes={codes} min={MIN_TREND_AREAS} max={MAX_TREND_AREAS} href="/trends" />

      {trendsResult &&
        trendsResult.match(
          (history) => {
            const series = groupByArea(history);
            return series.length > 0 ? (
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>取引件数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrendComparisonChart series={series} metric="transactionCount" unit="件" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>平均坪単価</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrendComparisonChart series={series} metric="avgUnitPriceYenPerSqm" unit="円/坪" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>中央値</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrendComparisonChart series={series} metric="medianPriceYen" unit="円" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="mt-6 text-muted-foreground">選択したエリアのデータがまだありません。</p>
            );
          },
          (error) => <p className="mt-6 text-destructive">{error.userMessage}</p>,
        )}
    </div>
  );
}
