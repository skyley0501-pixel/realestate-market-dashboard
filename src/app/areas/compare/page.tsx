import { CompareAreasUseCase, MAX_COMPARE_AREAS, MIN_COMPARE_AREAS } from "@/features/market/application/use-cases/compare-areas.usecase";
import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaMultiSelector } from "@/features/market/presentation/components/AreaMultiSelector";
import { toAreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";
import { AreaComparisonView, type AreaComparisonMetrics } from "@/shared/ui/components/charts/AreaComparisonView";

type SearchParams = Record<string, string | string[] | undefined>;

function parseCodes(value: string | string[] | undefined): string[] {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

function toComparisonMetrics(dto: ReturnType<typeof toAreaSnapshotDto>): AreaComparisonMetrics {
  return {
    code: dto.code,
    label: `${dto.prefectureName}${dto.name}`,
    avgUnitPriceYenPerSqm: dto.avgUnitPriceYenPerSqm,
    medianPriceYen: Number(dto.medianPriceYen),
    transactionCount: dto.transactionCount,
    trendRatePercent: dto.trendRatePercent,
  };
}

export default async function AreaComparePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const codes = parseCodes(params.codes);

  const areasResult = await marketContainer.getListAreasUseCase().execute();
  const areas = areasResult.match(
    (snapshots) => snapshots.map(toAreaSnapshotDto),
    () => [],
  );

  const compareResult: Awaited<ReturnType<CompareAreasUseCase["execute"]>> | null =
    codes.length >= MIN_COMPARE_AREAS ? await marketContainer.getCompareAreasUseCase().execute({ codes }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">エリア比較</h1>

      <AreaMultiSelector
        areas={areas}
        selectedCodes={codes}
        min={MIN_COMPARE_AREAS}
        max={MAX_COMPARE_AREAS}
        href="/areas/compare"
      />

      {compareResult &&
        compareResult.match(
          (snapshots) => {
            const metrics = snapshots.map((snapshot) => toComparisonMetrics(toAreaSnapshotDto(snapshot)));
            return metrics.length > 0 ? (
              <AreaComparisonView areas={metrics} />
            ) : (
              <p className="text-muted-foreground">選択したエリアのデータがまだありません。</p>
            );
          },
          (error) => <p className="text-destructive">{error.userMessage}</p>,
        )}
    </div>
  );
}
