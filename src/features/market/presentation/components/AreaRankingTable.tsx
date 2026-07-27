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
import { formatTrendText, formatTsuboPrice, formatYen, trendColorClass } from "../lib/format";

export type AreaSortKey = "unitPrice" | "trendRate" | "transactionCount";
export type SortOrder = "asc" | "desc";

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
  return <span className={trendColorClass(trendRatePercent)}>{formatTrendText(trendRatePercent)}</span>;
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
            <TableCell>
              <Link href={`/areas/${area.code}`} className="hover:underline">
                {area.name}
              </Link>
            </TableCell>
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
