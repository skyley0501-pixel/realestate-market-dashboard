import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reinsReportContainer } from "@/features/reins-report/infrastructure/container";
import { ReinsPriceGapChart } from "@/features/reins-report/presentation/components/ReinsPriceGapChart";
import { ReinsVolumeChart } from "@/features/reins-report/presentation/components/ReinsVolumeChart";
import {
  formatPeriodLabel,
  formatYoyText,
  toReinsReportDto,
  yoyChangePercent,
  yoyColorClass,
  type ReinsMarketStatDto,
} from "@/features/reins-report/presentation/mappers/reins-report.mapper";

// ReinsMarketStatは手動追加でのみ更新されるため、ビルド時の静的生成に固定されないよう毎回DBから取得する
export const dynamic = "force-dynamic";

function latestOf(history: ReinsMarketStatDto[]): ReinsMarketStatDto | null {
  return history.length > 0 ? history[history.length - 1] : null;
}

export default async function ReinsReportPage() {
  const result = await reinsReportContainer.getReinsReportUseCase().execute();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">首都圏中古住宅市場レポート</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        公益財団法人東日本不動産流通機構（東日本レインズ）が公表する「月例速報マーケットウオッチ」をもとに、首都圏（1都3県）の中古マンション・中古戸建住宅の需給動向をまとめています。
      </p>

      {result.match(
        (report) => {
          const dto = toReinsReportDto(report);
          const latestCondo = latestOf(dto.metroCondoHistory);

          if (!latestCondo) {
            return <p className="text-muted-foreground">データがまだありません。</p>;
          }

          const contractCountYoy = yoyChangePercent(dto.metroCondoHistory, (d) => d.contractCount);
          const contractUnitPriceYoy = yoyChangePercent(dto.metroCondoHistory, (d) => d.contractUnitPriceManYen);
          const inventoryCountYoy = yoyChangePercent(dto.metroCondoHistory, (d) => d.inventoryCount);
          const priceGapPercent =
            latestCondo.contractUnitPriceManYen && latestCondo.newListingUnitPriceManYen
              ? Math.round(
                  ((latestCondo.newListingUnitPriceManYen - latestCondo.contractUnitPriceManYen) /
                    latestCondo.contractUnitPriceManYen) *
                    1000,
                ) / 10
              : null;

          return (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {formatPeriodLabel(latestCondo.period)}度時点（首都圏中古マンション）
              </p>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-muted-foreground">成約件数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">{latestCondo.contractCount.toLocaleString("ja-JP")}件</p>
                    <p className={`mt-1 text-xs ${yoyColorClass(contractCountYoy)}`}>
                      前年同月比 {formatYoyText(contractCountYoy)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-muted-foreground">成約㎡単価</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">
                      {latestCondo.contractUnitPriceManYen?.toLocaleString("ja-JP")}万円/㎡
                    </p>
                    <p className={`mt-1 text-xs ${yoyColorClass(contractUnitPriceYoy)}`}>
                      前年同月比 {formatYoyText(contractUnitPriceYoy)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-muted-foreground">在庫件数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">{latestCondo.inventoryCount?.toLocaleString("ja-JP")}件</p>
                    <p className={`mt-1 text-xs ${yoyColorClass(inventoryCountYoy)}`}>
                      前年同月比 {formatYoyText(inventoryCountYoy)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-2">
                <CardHeader>
                  <CardTitle>成約件数・在庫件数の推移（首都圏中古マンション）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReinsVolumeChart history={dto.metroCondoHistory} />
                </CardContent>
              </Card>
              <p className="mb-6 text-xs text-muted-foreground">
                成約件数は減少傾向、在庫件数は増加傾向が続いており、売り物件が積み上がりやすい状況がうかがえます。
              </p>

              <Card className="mb-2">
                <CardHeader>
                  <CardTitle>成約㎡単価と新規登録㎡単価の乖離（首都圏中古マンション）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReinsPriceGapChart history={dto.metroCondoHistory} />
                </CardContent>
              </Card>
              <p className="mb-6 text-xs text-muted-foreground">
                「新規登録㎡単価」は売り出し時点の価格、「成約㎡単価」は実際に売買が成立した価格です。
                {priceGapPercent !== null &&
                  ` ${formatPeriodLabel(latestCondo.period)}度時点で、売り出し価格は成約価格より約${priceGapPercent}%高い水準にあります。`}
              </p>

              <h2 className="mb-2 mt-8 text-lg font-semibold">都県別の直近動向（中古マンション）</h2>
              <div className="mb-6 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="whitespace-nowrap px-3 py-3 font-medium">エリア</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">成約件数</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">前年同月比</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">成約㎡単価</th>
                      <th className="whitespace-nowrap px-3 py-3 font-medium">前年同月比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dto.areaCondoHistories.map((areaHistory) => {
                      const latest = latestOf(areaHistory.history);
                      if (!latest) return null;
                      const countYoy = yoyChangePercent(areaHistory.history, (d) => d.contractCount);
                      const priceYoy = yoyChangePercent(areaHistory.history, (d) => d.contractUnitPriceManYen);
                      return (
                        <tr key={areaHistory.region} className="border-b last:border-b-0">
                          <td className="whitespace-nowrap px-3 py-3 font-medium">{areaHistory.region}</td>
                          <td className="whitespace-nowrap px-3 py-3">{latest.contractCount.toLocaleString("ja-JP")}件</td>
                          <td className={`whitespace-nowrap px-3 py-3 ${yoyColorClass(countYoy)}`}>
                            {formatYoyText(countYoy)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {latest.contractUnitPriceManYen?.toLocaleString("ja-JP")}万円/㎡
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${yoyColorClass(priceYoy)}`}>
                            {formatYoyText(priceYoy)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {dto.metroDetachedHistory.length > 0 && (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-semibold">中古戸建住宅の動向（首都圏）</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>成約件数・在庫件数の推移（首都圏中古戸建住宅）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReinsVolumeChart history={dto.metroDetachedHistory} />
                    </CardContent>
                  </Card>
                  <p className="mt-2 text-xs text-muted-foreground">
                    中古戸建住宅は、マンションほど極端な件数減少は見られず、価格は高止まりの傾向が続いています。
                  </p>
                </>
              )}

              <section className="mt-10 border-t pt-8">
                <h2 className="mb-4 text-lg font-semibold">現場からの所感・今後の見通し</h2>
                <div className="space-y-4 text-sm leading-7 text-muted-foreground">
                  <p>
                    法務・契約事務を担当する立場として、毎週の会議で営業からの報告を聞いたり、価格変更の申請に事務方として対応する中で、この数ヶ月は特に「高額帯のマンションほど、思い切った値下げをしても成約に至らない」という声を耳にする機会が増えたと感じています。
                  </p>
                  <p>
                    今回のデータを見ると、東京都区部の成約件数は8ヶ月連続で減少し、直近では成約㎡単価もついに76ヶ月ぶりに下落へ転じました。一方で売り出し価格（新規登録㎡単価）は上昇を続けたままで、両者の差は過去にないほど大きく広がっています。現場の声だけでなく数字としても、「売り出し価格」と「実際に買い手がつく価格」のズレが目立ってきている局面だと言えそうです。
                  </p>
                  <p>
                    在庫件数が6ヶ月連続で増加し、しかも増加率が拡大していることを踏まえると、当面は「高値での売り出しがそのまま長期化する」物件が増えていくと見ています。価格変更の事務対応をしていても、実感に近い数字だと感じます。売主様にとっては、早めに相場観を見直し、価格改定のタイミングを逃さないことがこれまで以上に重要になってくるのではないでしょうか。買主様にとっては、じっくり比較検討できる環境が整いつつあるとも言えます。
                  </p>
                </div>
              </section>

              <p className="mt-8 text-xs text-muted-foreground">
                データ出典: 公益財団法人東日本不動産流通機構「月例速報マーケットウオッチ・サマリーレポート＜
                {formatPeriodLabel(latestCondo.period)}度＞」をもとにREMDAが作成。
              </p>
            </>
          );
        },
        (error) => <p className="text-destructive">{error.userMessage}</p>,
      )}
    </div>
  );
}
