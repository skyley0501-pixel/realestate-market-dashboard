import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { Transaction } from "../../domain/entities/transaction";
import type {
  TransactionRepository,
  TransactionSearchCriteria,
} from "../../domain/repositories/transaction-repository";

export class SearchTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    criteria: TransactionSearchCriteria,
  ): Promise<Result<Transaction[], ApplicationError>> {
    try {
      const transactions = await this.transactionRepository.search(criteria);
      return Result.ok(transactions);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "TRANSACTION_SEARCH_FAILED",
          `取引検索に失敗しました: ${String(error)}`,
          "取引の検索に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
