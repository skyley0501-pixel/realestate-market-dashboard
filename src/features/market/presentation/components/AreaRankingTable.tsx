import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import type { AreaSnapshotDto } from "../mappers/area-snapshot.mapper";

const SQM_PER_TSUBO = 3.30578;

export type AreaSortKey = "unitPrice" | "trendRate" | "transactionCount";
export type SortOrder = "asc" | "desc";

function formatYen(priceYen: string): string {
  return `${BigInt(priceYen).toLocaleString("ja-JP")}円`;
}

function formatTsuboPrice(avgUnitPriceYenPerSqm: number): string {
  return `${Math.round(avgUnitPriceYenPerSqm * SQM_PER_TSUBO).toLocaleString("ja-JP")}円/坪`;
}

// クリックすると反転する（同じキーなら昇順⇔降順、別キーに切り替えた場合は降順から開始）ソートリンクのhrefを組み立てる
function buildSortHref(key: AreaSortKey, currentSort: AreaSortKey, currentOrder: SortOrder): string {
  const nextOrder: SortOrder = key === currentSort && currentOrder === "desc" ? "asc" : "desc";
  return `/areas?sort=${key}&order=${nextOrder}`;
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
}: {
  label: string;
  sortKey: AreaSortKey;
  currentSort: AreaSortKey;
  currentOrder: SortOrder;
}) {
  const isActive = sortKey === currentSort;
  const Icon = isActive ? (currentOrder === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;

  return (
    <Link
      href={buildSortHref(sortKey, currentSort, currentOrder)}
      className="flex items-center justify-end gap-1 hover:underline"
    >
      {label}
      <Icon className="size-3.5" />
    </Link>
  );
}

function TrendCell({ trendRatePercent }: { trendRatePercent: number | null }) {
  if (trendRatePercent === null) {
    return <span className="text-muted-foreground">-</span>;
  }
  const color =
    trendRatePercent > 0 ? "text-emerald-600" : trendRatePercent < 0 ? "text-red-600" : "text-muted-foreground";
  const sign = trendRatePercent > 0 ? "+" : "";
  return <span className={color}>{`${sign}${trendRatePercent.toFixed(1)}%`}</span>;
}

export function AreaRankingTable({
  areas,
  sort,
  order,
}: {
  areas: AreaSnapshotDto[];
  sort: AreaSortKey;
  order: SortOrder;
}) {
  if (areas.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">エリアデータがまだありません。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>エリア</TableHead>
          <TableHead className="text-right">中央値</TableHead>
          <TableHead className="text-right">
            <SortableHeader label="坪単価" sortKey="unitPrice" currentSort={sort} currentOrder={order} />
          </TableHead>
          <TableHead className="text-right">
            <SortableHeader label="前期比" sortKey="trendRate" currentSort={sort} currentOrder={order} />
          </TableHead>
          <TableHead className="text-right">
            <SortableHeader label="件数" sortKey="transactionCount" currentSort={sort} currentOrder={order} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {areas.map((area) => (
          <TableRow key={area.code}>
            <TableCell>{area.name}</TableCell>
            <TableCell className="text-right">{formatYen(area.medianPriceYen)}</TableCell>
            <TableCell className="text-right">{formatTsuboPrice(area.avgUnitPriceYenPerSqm)}</TableCell>
            <TableCell className="text-right">
              <TrendCell trendRatePercent={area.trendRatePercent} />
            </TableCell>
            <TableCell className="text-right">{area.transactionCount}件</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
