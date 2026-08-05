import { marketContainer } from "@/features/market/infrastructure/container";
import { StatCard } from "@/features/market/presentation/components/StatCard";
import { formatTrendText, formatTsuboPrice, formatYen, trendColorClass } from "@/features/market/presentation/lib/format";
import { groupByArea } from "@/features/market/presentation/lib/trend-grouping";
import { MIN_TREND_AREAS } from "@/features/market/presentation/lib/trend-selection";
import { TrendComparisonChart } from "@/shared/ui/components/charts/TrendComparisonChart";
import { HeatmapLegend } from "@/shared/ui/components/map/HeatmapLegend";
import { MarketMap } from "@/shared/ui/components/map/MarketMap";

// トレンドサマリーに表示する代表エリア数（坪単価が高い順）
const TOP_AREA_COUNT = 3;

export default async function DashboardPage() {
  const [summaryResult, areasResult] = await Promise.all([
    marketContainer.getDashboardSummaryUseCase().execute(),
    marketContainer.getListAreasUseCase().execute(),
  ]);

  const topCodes = areasResult
    .match(
      (snapshots) => [...snapshots],
      () => [],
    )
    .sort((a, b) => b.avgUnitPriceYenPerSqm - a.avgUnitPriceYenPerSqm)
    .slice(0, TOP_AREA_COUNT)
    .map((s) => s.area.code);

  const trendsResult =
    topCodes.length >= MIN_TREND_AREAS ? await marketContainer.getTrendsUseCase().execute({ codes: topCodes }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>

      {summaryResult.match(
        (summary) => (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard label="対象エリア数" value={`${summary.areaCount}エリア`} />
            <StatCard label="平均坪単価" value={formatTsuboPrice(summary.avgUnitPriceYenPerSqm)} />
            <StatCard label="平均中央値" value={formatYen(summary.avgMedianPriceYen)} />
            <StatCard
              label="平均前期比"
              value={formatTrendText(summary.avgTrendRatePercent)}
              valueClassName={trendColorClass(summary.avgTrendRatePercent)}
            />
            <StatCard label="取引総数" value={`${summary.totalTransactionCount}件`} />
          </div>
        ),
        (error) => <p className="mb-8 text-destructive">{error.userMessage}</p>,
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">坪単価トップ{TOP_AREA_COUNT}エリアの価格推移</h2>
        {trendsResult ? (
          trendsResult.match(
            (history) => {
              const series = groupByArea(history);
              return series.length > 0 ? (
                <TrendComparisonChart series={series} />
              ) : (
                <p className="text-muted-foreground">データがまだありません。</p>
              );
            },
            (error) => <p className="text-destructive">{error.userMessage}</p>,
          )
        ) : (
          <p className="text-muted-foreground">データがまだありません。</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">マーケットマップ</h2>
        <MarketMap />
        <HeatmapLegend />
      </section>
    </div>
  );
}
