import { marketContainer } from "@/features/market/infrastructure/container";
import { AreaRankingTable, type AreaSortKey, type SortOrder } from "@/features/market/presentation/components/AreaRankingTable";
import { toAreaSnapshotDto, type AreaSnapshotDto } from "@/features/market/presentation/mappers/area-snapshot.mapper";

type SearchParams = Record<string, string | string[] | undefined>;

function parseSortKey(value: string | string[] | undefined): AreaSortKey {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "trendRate" || v === "transactionCount" ? v : "unitPrice";
}

function parseSortOrder(value: string | string[] | undefined): SortOrder {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "asc" ? "asc" : "desc";
}

function sortValue(area: AreaSnapshotDto, sort: AreaSortKey): number {
  switch (sort) {
    case "unitPrice":
      return area.avgUnitPriceYenPerSqm;
    case "trendRate":
      // 前期データが無いエリアは常に末尾に回す
      return area.trendRatePercent ?? Number.NEGATIVE_INFINITY;
    case "transactionCount":
      return area.transactionCount;
  }
}

export default async function AreasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sort = parseSortKey(params.sort);
  const order = parseSortOrder(params.order);

  const useCase = marketContainer.getListAreasUseCase();
  const result = await useCase.execute();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">エリアランキング</h1>
      {result.match(
        (snapshots) => {
          const areas = snapshots.map(toAreaSnapshotDto);
          const sorted = [...areas].sort((a, b) => {
            const diff = sortValue(a, sort) - sortValue(b, sort);
            return order === "asc" ? diff : -diff;
          });
          return <AreaRankingTable areas={sorted} sort={sort} order={order} />;
        },
        (error) => <p className="text-destructive">{error.userMessage}</p>,
      )}
    </div>
  );
}
