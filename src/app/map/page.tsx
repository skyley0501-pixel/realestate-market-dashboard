import { MarketMap } from "@/shared/ui/components/map/MarketMap";

export default function MapPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">マーケットマップ</h1>
      <MarketMap />
      <p className="mt-4 text-xs text-muted-foreground">
        行政区域データ出典: 国土交通省 国土数値情報（加工: スマートニュース メディア研究所）
      </p>
    </div>
  );
}
