import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { Transaction } from "../../domain/entities/transaction";
import type { TransactionRepository } from "../../domain/repositories/transaction-repository";

export interface GetTransactionDetailInput {
  id: string;
}

export class GetTransactionDetailUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    input: GetTransactionDetailInput,
  ): Promise<Result<Transaction, ApplicationError>> {
    try {
      const transaction = await this.transactionRepository.findById(input.id);
      if (!transaction) {
        return Result.err(
          new ApplicationError(
            "TRANSACTION_NOT_FOUND",
            `取引が見つかりません: id=${input.id}`,
            "指定された取引が見つかりませんでした。",
          ),
        );
      }
      return Result.ok(transaction);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "TRANSACTION_DETAIL_FAILED",
          `取引詳細の取得に失敗しました: ${String(error)}`,
          "取引詳細の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
