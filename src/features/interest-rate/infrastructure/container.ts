import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetInterestRateTrendUseCase } from "../application/use-cases/get-interest-rate-trend.usecase";
import { PrismaInterestRateRepository } from "./prisma-interest-rate-repository";

const interestRateRepository = new PrismaInterestRateRepository(prisma);

export const interestRateContainer = {
  getInterestRateTrendUseCase: () => new GetInterestRateTrendUseCase(interestRateRepository),
};
