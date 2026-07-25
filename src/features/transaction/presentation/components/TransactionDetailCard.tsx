import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TransactionSummaryDto } from "../mappers/transaction-summary.mapper";

function formatYen(priceYen: string): string {
  return `${BigInt(priceYen).toLocaleString("ja-JP")}円`;
}

function formatUnitPricePerSqm(priceYen: string, areaSqm: number): string {
  const unitPrice = Math.round(Number(BigInt(priceYen)) / areaSqm);
  return `${unitPrice.toLocaleString("ja-JP")}円/㎡`;
}

interface DetailRow {
  label: string;
  value: string | null;
}

export function TransactionDetailCard({ transaction }: { transaction: TransactionSummaryDto }) {
  const rows: DetailRow[] = [
    { label: "市区町村コード", value: transaction.municipalityCode },
    { label: "取引時期", value: transaction.transactionPeriod },
    { label: "面積", value: `${transaction.areaSqm}㎡` },
    { label: "平米単価", value: formatUnitPricePerSqm(transaction.priceYen, transaction.areaSqm) },
    { label: "間取り", value: transaction.floorPlan },
    {
      label: "築年数",
      value: transaction.buildingAgeYears !== null ? `${transaction.buildingAgeYears}年` : null,
    },
    { label: "建物の構造", value: transaction.structure },
    { label: "用途", value: transaction.use },
    { label: "取引の事情等", value: transaction.remarks },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{transaction.propertyType}</Badge>
        </div>
        <CardTitle className="text-3xl">{formatYen(transaction.priceYen)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 sm:flex-col sm:gap-1">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
