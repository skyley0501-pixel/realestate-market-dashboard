import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaMultiSelector } from "@/features/market/presentation/components/AreaMultiSelector";
import {
  formatPeriodLabel,
  formatTrendText,
  formatTsuboPrice,
  formatYen,
  trendColorClass,
} from "@/features/market/presentation/lib/format";
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

  const summaryResult = await marketContainer.getDashboardSummaryUseCase().execute();

  const trendsResult =
    codes.length >= MIN_TREND_AREAS ? await marketContainer.getTrendsUseCase().execute({ codes }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">エリア比較</h1>

      {summaryResult.match(
        (summary) =>
          summary.byPrefecture.length > 0 && (
            <section className="mb-10" aria-labelledby="prefecture-heading">
              <p className="font-mono text-xs tracking-widest text-muted-foreground">BY PREFECTURE</p>
              <h2 id="prefecture-heading" className="mt-2 text-xl font-semibold">
                都道府県別の市場動向
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                都心部と山間部を同じ平均に混ぜないよう、坪単価・前期比・中央値は<strong className="text-foreground">都道府県ごと</strong>
                に算出しています。また、5年累計の取引件数が少ない市区町村（統計的な代表性が低いエリア）は、この集計から除外しています。
              </p>
              <div className="mt-6 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="whitespace-nowrap px-3 py-3 font-medium">都道府県</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">エリア数</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">取引件数</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">平均坪単価</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">平均前期比</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">平均中央値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byPrefecture.map((pref) => (
                      <tr key={pref.prefectureCode} className="border-b last:border-b-0">
                        <td className="whitespace-nowrap px-3 py-3 font-medium">{pref.prefectureName}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {pref.areaCount.toLocaleString("ja-JP")}エリア
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {pref.totalTransactionCount.toLocaleString("ja-JP")}件
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{formatTsuboPrice(pref.avgUnitPriceYenPerSqm)}</td>
                        <td className={`whitespace-nowrap px-3 py-3 ${trendColorClass(pref.avgTrendRatePercent)}`}>
                          {formatTrendText(pref.avgTrendRatePercent)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{formatYen(pref.avgMedianPriceYen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ),
        () => null,
      )}

      {summaryResult.match(
        (summary) =>
          summary.latestPeriod && (
            <section className="mb-10 border-t pt-8">
              <p className="font-mono text-xs tracking-widest text-muted-foreground">ABOUT THIS DATA</p>
              <h2 className="mt-2 text-xl font-semibold">統計データについて</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                上記の統計は<strong className="text-foreground">{formatPeriodLabel(summary.latestPeriod)}（速報値）</strong>
                時点のものです。国土交通省データの反映状況により、直近期間は今後の値の見直しで変動する場合があります。
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>
                  <strong className="text-foreground">対象エリア数</strong>
                  ：{formatPeriodLabel(summary.latestPeriod)}に取引実績があった市区町村の数。
                </li>
                <li>
                  <strong className="text-foreground">取引総数</strong>
                  ：{formatPeriodLabel(summary.latestPeriod)}
                  （1四半期分）の取引件数の合計。データベース全体の累計件数ではありません。
                </li>
                <li>
                  <strong className="text-foreground">平均坪単価</strong>
                  ：各市区町村内の全取引について「価格÷面積」を算出し、市区町村ごとに平均（外れ値除去なし）した上で、
                  同じ都道府県内のエリアで平均した値。
                </li>
                <li>
                  <strong className="text-foreground">平均前期比</strong>
                  ：各市区町村の中央値（外れ値除去後）を1つ前の四半期の中央値と比べた変化率を、同じ都道府県内のエリアで平均した値。
                </li>
                <li>
                  <strong className="text-foreground">平均中央値</strong>
                  ：各市区町村の取引価格の中央値（外れ値除去後）を、同じ都道府県内のエリアで平均した値。
                </li>
              </ul>
            </section>
          ),
        () => null,
      )}

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
