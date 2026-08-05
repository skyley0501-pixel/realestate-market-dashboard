import type { AreaSnapshotDto } from "../mappers/area-snapshot.mapper";
import { formatTrendText, formatTsuboPrice, formatYen, trendColorClass } from "../lib/format";
import { StatCard } from "./StatCard";

export function AreaDetailHeader({ area }: { area: AreaSnapshotDto }) {
  return (
    <div className="mb-8">
      <p className="text-sm text-muted-foreground">{area.prefectureName}</p>
      <h1 className="mb-4 text-3xl font-bold">{area.name}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="中央値" value={formatYen(area.medianPriceYen)} />
        <StatCard label="坪単価" value={formatTsuboPrice(area.avgUnitPriceYenPerSqm)} />
        <StatCard
          label="前期比"
          value={formatTrendText(area.trendRatePercent)}
          valueClassName={trendColorClass(area.trendRatePercent)}
        />
        <StatCard label="取引件数" value={`${area.transactionCount}件`} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">対象期間: {area.period}</p>
    </div>
  );
}
