import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { TransactionRepository } from "../../domain/repositories/transaction-repository";

export class ListFloorPlansUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(): Promise<Result<string[], ApplicationError>> {
    try {
      const floorPlans = await this.transactionRepository.findDistinctFloorPlans();
      return Result.ok(floorPlans);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "FLOOR_PLAN_LIST_FAILED",
          `間取り一覧の取得に失敗しました: ${String(error)}`,
          "間取り一覧の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
