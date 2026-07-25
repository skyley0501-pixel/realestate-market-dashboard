import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import type { TransactionSummaryDto } from "../mappers/transaction-summary.mapper";

function formatYen(priceYen: string): string {
  return `${BigInt(priceYen).toLocaleString("ja-JP")}円`;
}

export function TransactionTable({ transactions }: { transactions: TransactionSummaryDto[] }) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        該当する取引が見つかりませんでした。
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>市区町村コード</TableHead>
          <TableHead>種類</TableHead>
          <TableHead>間取り</TableHead>
          <TableHead>面積</TableHead>
          <TableHead>築年数</TableHead>
          <TableHead className="text-right">価格</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <Link href={`/transactions/${transaction.id}`} className="hover:underline">
                {transaction.municipalityCode}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{transaction.propertyType}</Badge>
            </TableCell>
            <TableCell>{transaction.floorPlan ?? "-"}</TableCell>
            <TableCell>{transaction.areaSqm}㎡</TableCell>
            <TableCell>
              {transaction.buildingAgeYears !== null ? `${transaction.buildingAgeYears}年` : "-"}
            </TableCell>
            <TableCell className="text-right">{formatYen(transaction.priceYen)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
