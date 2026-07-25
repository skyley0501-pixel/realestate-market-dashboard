import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetTransactionDetailUseCase } from "../application/use-cases/get-transaction-detail.usecase";
import { SearchTransactionsUseCase } from "../application/use-cases/search-transactions.usecase";
import { PrismaTransactionRepository } from "./prisma-transaction-repository";

// DIコンポジションルート。Route Handlerはここ経由でUseCaseを取得し、具象クラスを知らない。
const transactionRepository = new PrismaTransactionRepository(prisma);

export const transactionContainer = {
  getSearchTransactionsUseCase: () => new SearchTransactionsUseCase(transactionRepository),
  getTransactionDetailUseCase: () => new GetTransactionDetailUseCase(transactionRepository),
};
