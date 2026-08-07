import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetTransactionDetailUseCase } from "../application/use-cases/get-transaction-detail.usecase";
import { ListFloorPlansUseCase } from "../application/use-cases/list-floor-plans.usecase";
import { ListMunicipalitiesUseCase } from "../application/use-cases/list-municipalities.usecase";
import { SearchTransactionsUseCase } from "../application/use-cases/search-transactions.usecase";
import { PrismaMunicipalityRepository } from "./prisma-municipality-repository";
import { PrismaTransactionRepository } from "./prisma-transaction-repository";

// DIコンポジションルート。Route Handlerはここ経由でUseCaseを取得し、具象クラスを知らない。
const transactionRepository = new PrismaTransactionRepository(prisma);
const municipalityRepository = new PrismaMunicipalityRepository(prisma);

export const transactionContainer = {
  getSearchTransactionsUseCase: () => new SearchTransactionsUseCase(transactionRepository),
  getTransactionDetailUseCase: () => new GetTransactionDetailUseCase(transactionRepository),
  getListMunicipalitiesUseCase: () => new ListMunicipalitiesUseCase(municipalityRepository),
  getListFloorPlansUseCase: () => new ListFloorPlansUseCase(transactionRepository),
};
