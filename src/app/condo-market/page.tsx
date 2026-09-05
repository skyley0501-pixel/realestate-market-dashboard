import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { condoMarketContainer } from "@/features/condo-market/infrastructure/container";
import { CondoMarketChart } from "@/features/condo-market/presentation/components/CondoMarketChart";
import { CondoSupplyChart } from "@/features/condo-market/presentation/components/CondoSupplyChart";
import { toCondoMarketTrendDto } from "@/features/condo-market/presentation/mappers/condo-market-trend.mapper";

export default async function CondoMarketPage() {
  const result = await condoMarketContainer.getCondoMarketTrendUseCase().execute();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">マンション市場動向</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        1都3県（東京都・神奈川県・千葉県・埼玉県）の新築分譲マンション供給戸数と、中古マンションの取引価格の推移です。
      </p>

      {result.match(
        (trend) => {
          const dto = toCondoMarketTrendDto(trend);
          return (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>新築分譲マンション着工戸数（年度）</CardTitle>
                </CardHeader>
                <CardContent>
                  {dto.condoSupply.length > 0 ? (
                    <CondoSupplyChart condoSupply={dto.condoSupply} />
                  ) : (
                    <p className="text-muted-foreground">データがまだありません。</p>
                  )}
                </CardContent>
              </Card>
              <p className="mb-6 text-xs text-muted-foreground">
                データ出典: 国土交通省「建築着工統計調査」（e-Stat経由、建て方＝共同住宅×利用関係＝分譲住宅で集計）。
                「着工」は工事開始のことで、実際の販売開始時期とは異なります。
              </p>

              <Card>
                <CardHeader>
                  <CardTitle>中古マンション取引価格（中央値・四半期）</CardTitle>
                </CardHeader>
                <CardContent>
                  {dto.condoMarketStats.length > 0 ? (
                    <CondoMarketChart condoMarketStats={dto.condoMarketStats} />
                  ) : (
                    <p className="text-muted-foreground">データがまだありません。</p>
                  )}
                </CardContent>
              </Card>
              <p className="mt-2 text-xs text-muted-foreground">
                データ出典: 国土交通省「不動産情報ライブラリ」の実取引データをもとにREMDAが独自集計（四分位範囲による外れ値除去済み）。
              </p>
            </>
          );
        },
        (error) => <p className="text-destructive">{error.userMessage}</p>,
      )}
    </div>
  );
}
