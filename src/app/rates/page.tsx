import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interestRateContainer } from "@/features/interest-rate/infrastructure/container";
import { InterestRateChart } from "@/features/interest-rate/presentation/components/InterestRateChart";
import { toInterestRateTrendDto } from "@/features/interest-rate/presentation/mappers/interest-rate-trend.mapper";

export default async function RatesPage() {
  const result = await interestRateContainer.getInterestRateTrendUseCase().execute();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">金利動向</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        日本国債10年利回りと日銀政策金利の推移です。住宅ローンの固定金利は主に長期金利（国債10年利回り）、変動金利は政策金利と連動する傾向があります。
      </p>

      {result.match(
        (trend) => {
          const dto = toInterestRateTrendDto(trend);
          return (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-muted-foreground">国債10年利回り</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">
                      {dto.latestJgbYield ? `${dto.latestJgbYield.tenYearRate.toFixed(3)}%` : "データなし"}
                    </p>
                    {dto.latestJgbYield && (
                      <p className="mt-1 text-xs text-muted-foreground">{dto.latestJgbYield.date} 時点</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-muted-foreground">日銀政策金利</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">
                      {dto.latestPolicyRate ? `${dto.latestPolicyRate.ratePercent.toFixed(2)}%` : "データなし"}
                    </p>
                    {dto.latestPolicyRate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dto.latestPolicyRate.effectiveDate}適用{dto.latestPolicyRate.note ? `（${dto.latestPolicyRate.note}）` : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {dto.jgbYields.length > 0 ? (
                <Card>
                  <CardContent>
                    <InterestRateChart trend={dto} />
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">データがまだありません。</p>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                データ出典: 財務省「国債金利情報」、日本銀行金融政策決定会合発表資料
              </p>
            </>
          );
        },
        (error) => <p className="text-destructive">{error.userMessage}</p>,
      )}
    </div>
  );
}
