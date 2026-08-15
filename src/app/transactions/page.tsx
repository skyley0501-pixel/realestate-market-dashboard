import { Button } from "@/components/ui/button";
import {
  findAreaSqmRange,
  findBuildingAgeRange,
} from "@/features/transaction/domain/constants/transaction-search-filters";
import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { NaturalLanguageSearchBox } from "@/features/transaction/presentation/components/NaturalLanguageSearchBox";
import { TransactionFilterPanel } from "@/features/transaction/presentation/components/TransactionFilterPanel";
import { TransactionTable } from "@/features/transaction/presentation/components/TransactionTable";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { Money } from "@/shared/domain/value-objects/money";
import Link from "next/link";

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function parseOptionalString(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

function parseOptionalPositiveInt(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// ページ送り時も現在のフィルタ条件を維持したURLを組み立てる
function buildPageHref(params: SearchParams, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) usp.set(key, v);
  }
  if (page > 1) usp.set("page", String(page));
  const query = usp.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const municipalityCode = parseOptionalString(params.municipalityCode);
  const propertyType = parseOptionalString(params.propertyType);
  const floorPlan = parseOptionalString(params.floorPlan);
  const minPrice = parseOptionalPositiveInt(params.minPrice);
  const maxPrice = parseOptionalPositiveInt(params.maxPrice);

  const areaSqmRange = findAreaSqmRange(parseOptionalString(params.areaSqmRange) ?? "");
  const buildingAgeRange = findBuildingAgeRange(parseOptionalString(params.buildingAgeRange) ?? "");
  // 築年数（経過年数）の範囲は、実行時点の年からbuildingYear（西暦）の範囲に変換して検索する
  const currentYear = new Date().getFullYear();
  // 自然文検索（/api/search/nl）はレンジのkeyではなく築年（西暦）を直接クエリパラメータとして渡すため、
  // 指定されていればそちらを優先する
  const naturalMinBuildingYear = parseOptionalPositiveInt(params.minBuildingYear);
  const minBuildingYear =
    naturalMinBuildingYear ??
    (buildingAgeRange?.maxBuildingAgeYears !== undefined ? currentYear - buildingAgeRange.maxBuildingAgeYears : undefined);
  const maxBuildingYear =
    buildingAgeRange?.minBuildingAgeYears !== undefined ? currentYear - buildingAgeRange.minBuildingAgeYears : undefined;

  const hasAnyFilter = Boolean(
    municipalityCode ||
      propertyType ||
      floorPlan ||
      minPrice !== undefined ||
      maxPrice !== undefined ||
      areaSqmRange ||
      buildingAgeRange ||
      minBuildingYear !== undefined,
  );

  const result = hasAnyFilter
    ? await transactionContainer.getSearchTransactionsUseCase().execute({
        municipalityCode,
        propertyType,
        floorPlan,
        minPrice: minPrice !== undefined ? Money.fromYen(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Money.fromYen(maxPrice) : undefined,
        minAreaSqm: areaSqmRange?.minAreaSqm,
        maxAreaSqm: areaSqmRange?.maxAreaSqm,
        minBuildingYear,
        maxBuildingYear,
        limit: PAGE_SIZE + 1,
        offset,
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">取引一覧</h1>
      <NaturalLanguageSearchBox />
      <TransactionFilterPanel />
      {!result ? (
        <p className="py-8 text-center text-muted-foreground">
          検索条件を指定して取引を検索してください。
        </p>
      ) : (
        result.match(
          (transactions) => {
            const hasNext = transactions.length > PAGE_SIZE;
            const items = transactions.slice(0, PAGE_SIZE).map(toTransactionSummary);

            return (
              <>
                <TransactionTable transactions={items} />
                <div className="mt-6 flex items-center justify-between">
                  {page > 1 ? (
                    <Button variant="outline" render={<Link href={buildPageHref(params, page - 1)} />}>
                      前へ
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      前へ
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">{page}ページ目</span>
                  {hasNext ? (
                    <Button variant="outline" render={<Link href={buildPageHref(params, page + 1)} />}>
                      次へ
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      次へ
                    </Button>
                  )}
                </div>
              </>
            );
          },
          (error) => <p className="text-destructive">{error.userMessage}</p>,
        )
      )}
    </div>
  );
}
