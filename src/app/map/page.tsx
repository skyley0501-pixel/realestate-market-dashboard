import { hazardContainer } from "@/features/hazard/infrastructure/container";
import { RegionDisasterHistoryMap } from "@/features/hazard/presentation/components/RegionDisasterHistoryMap";
import { toDisasterHistoryDtos } from "@/features/hazard/presentation/mappers/area-hazard-info.mapper";
import { HeatmapLegend } from "@/shared/ui/components/map/HeatmapLegend";
import { MarketMap } from "@/shared/ui/components/map/MarketMap";

export default async function MapPage() {
  const disasterHistoryResult = await hazardContainer.getRegionDisasterHistoryUseCase().execute();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">坪単価ヒートマップ</h1>
      <MarketMap />
      <HeatmapLegend />
      <p className="mt-4 text-xs text-muted-foreground">
        行政区域データ出典: 国土交通省 国土数値情報（加工: スマートニュース メディア研究所）
      </p>

      {disasterHistoryResult.match(
        (histories) => {
          const dtos = toDisasterHistoryDtos(histories);
          return (
            dtos.length > 0 && (
              <section className="mt-10 border-t pt-8">
                <h2 className="mb-2 text-xl font-bold">ハザードマップ（過去の水害・土砂災害履歴）</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  1都3県で過去に発生した浸水・がけ崩れ・地すべり等の履歴{dtos.length}件です。地図上のマーカー・範囲をクリックすると詳細が表示されます。
                </p>
                <RegionDisasterHistoryMap histories={dtos} />
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-[#1c5cab]" />
                    浸水・堤防決壊等
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-[#92400e]" />
                    がけ崩れ・地すべり等
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  データ出典: 国土交通省「不動産情報ライブラリ」防災情報API。各エリアの詳細は
                  <a href="/areas" className="underline underline-offset-2 hover:text-foreground">
                    エリアランキング
                  </a>
                  から市区町村ページをご覧ください。
                </p>
              </section>
            )
          );
        },
        () => null,
      )}
    </div>
  );
}
