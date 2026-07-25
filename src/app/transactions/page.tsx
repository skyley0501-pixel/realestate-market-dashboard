import { Button } from "@/components/ui/button";
import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { TransactionTable } from "@/features/transaction/presentation/components/TransactionTable";
import Link from "next/link";

const PAGE_SIZE = 20;

function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const useCase = transactionContainer.getSearchTransactionsUseCase();
  const result = await useCase.execute({ limit: PAGE_SIZE + 1, offset });

  return result.match(
    (transactions) => {
      const hasNext = transactions.length > PAGE_SIZE;
      const items = transactions.slice(0, PAGE_SIZE).map(toTransactionSummary);

      return (
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold">取引一覧</h1>
          <TransactionTable transactions={items} />
          <div className="mt-6 flex items-center justify-between">
            {page > 1 ? (
              <Button
                variant="outline"
                render={<Link href={page === 2 ? "/transactions" : `/transactions?page=${page - 1}`} />}
              >
                前へ
              </Button>
            ) : (
              <Button variant="outline" disabled>
                前へ
              </Button>
            )}
            <span className="text-sm text-muted-foreground">{page}ページ目</span>
            {hasNext ? (
              <Button variant="outline" render={<Link href={`/transactions?page=${page + 1}`} />}>
                次へ
              </Button>
            ) : (
              <Button variant="outline" disabled>
                次へ
              </Button>
            )}
          </div>
        </div>
      );
    },
    (error) => (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">取引一覧</h1>
        <p className="text-destructive">{error.userMessage}</p>
      </div>
    ),
  );
}
