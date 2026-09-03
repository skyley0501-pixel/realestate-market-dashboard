import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaDetailHeader } from "@/features/market/presentation/components/AreaDetailHeader";
import { AreaReportPanel } from "@/features/market/presentation/components/AreaReportPanel";
import { FloorPlanDistributionChart } from "@/features/market/presentation/components/FloorPlanDistributionChart";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { hazardContainer } from "@/features/hazard/infrastructure/container";
import { toAreaHazardInfoDto } from "@/features/hazard/presentation/mappers/area-hazard-info.mapper";
import { HazardZoneBadges } from "@/features/hazard/presentation/components/HazardZoneBadges";
import { DisasterHistoryList } from "@/features/hazard/presentation/components/DisasterHistoryList";
import { PriceTrendChart } from "@/shared/ui/components/charts/PriceTrendChart";
import { notFound } from "next/navigation";

// 取引件数が多いエリアでも全件を分布集計の対象にできるよう大きめに取得する
const FLOOR_PLAN_SAMPLE_LIMIT = 1000;

function summarizeFloorPlans(floorPlans: (string | null)[]): { labels: string[]; counts: number[] } {
  const counts = new Map<string, number>();
  for (const floorPlan of floorPlans) {
    const key = floorPlan ?? "不明";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { labels: sorted.map(([label]) => label), counts: sorted.map(([, count]) => count) };
}

export default async function AreaDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const [detailResult, historyResult, transactionsResult, hazardResult] = await Promise.all([
    marketContainer.getAreaDetailUseCase().execute({ code }),
    marketContainer.getAreaPriceHistoryUseCase().execute({ code }),
    transactionContainer.getSearchTransactionsUseCase().execute({
      municipalityCode: code,
      limit: FLOOR_PLAN_SAMPLE_LIMIT,
    }),
    hazardContainer.getAreaHazardInfoUseCase().execute({ municipalityCode: code }),
  ]);

  return detailResult.match(
    (snapshot) => {
      const area = toAreaSnapshotDto(snapshot);
      const history = historyResult.match(
        (snapshots) => snapshots.map(toAreaSnapshotDto),
        () => [],
      );
      const transactions = transactionsResult.match(
        (list) => list.map(toTransactionSummary),
        () => [],
      );
      const floorPlanSummary = summarizeFloorPlans(transactions.map((t) => t.floorPlan));
      const hazardInfo = hazardResult.match(toAreaHazardInfoDto, () => ({ hazardZone: null, disasterHistories: [] }));

      return (
        <div className="mx-auto max-w-5xl px-4 py-8">
          <AreaDetailHeader area={area} />

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">AIによる市況講評</h2>
            <AreaReportPanel key={area.code} code={area.code} />
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">価格推移（中央値）</h2>
            <PriceTrendChart
              labels={history.map((h) => h.period)}
              values={history.map((h) => Number(h.medianPriceYen))}
            />
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">間取り別分布</h2>
            <FloorPlanDistributionChart labels={floorPlanSummary.labels} counts={floorPlanSummary.counts} />
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">水害・土砂災害リスク</h2>
            <HazardZoneBadges hazardZone={hazardInfo.hazardZone} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">過去の水害・土砂災害履歴</h2>
            <DisasterHistoryList histories={hazardInfo.disasterHistories} />
          </section>
        </div>
      );
    },
    (error) => {
      if (error.code === "AREA_NOT_FOUND") notFound();
      return <p className="text-destructive">{error.userMessage}</p>;
    },
  );
}
