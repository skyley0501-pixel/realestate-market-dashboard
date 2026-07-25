import { BackButton } from "@/components/layout/BackButton";
import { transactionContainer } from "@/features/transaction/infrastructure/container";
import { TransactionDetailCard } from "@/features/transaction/presentation/components/TransactionDetailCard";
import { toTransactionSummary } from "@/features/transaction/presentation/mappers/transaction-summary.mapper";
import { notFound } from "next/navigation";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const useCase = transactionContainer.getTransactionDetailUseCase();
  const result = await useCase.execute({ id });

  return result.match(
    (transaction) => (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>
        <TransactionDetailCard transaction={toTransactionSummary(transaction)} />
      </div>
    ),
    (error) => {
      if (error.code === "TRANSACTION_NOT_FOUND") notFound();
      return (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-destructive">{error.userMessage}</p>
        </div>
      );
    },
  );
}
