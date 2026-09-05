import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetCondoMarketTrendUseCase } from "../application/use-cases/get-condo-market-trend.usecase";
import { PrismaCondoMarketRepository } from "./prisma-condo-market-repository";

const condoMarketRepository = new PrismaCondoMarketRepository(prisma);

export const condoMarketContainer = {
  getCondoMarketTrendUseCase: () => new GetCondoMarketTrendUseCase(condoMarketRepository),
};
