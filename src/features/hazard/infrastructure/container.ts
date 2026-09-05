import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetAreaHazardInfoUseCase } from "../application/use-cases/get-area-hazard-info.usecase";
import { GetRegionDisasterHistoryUseCase } from "../application/use-cases/get-region-disaster-history.usecase";
import { PrismaHazardRepository } from "./prisma-hazard-repository";

const hazardRepository = new PrismaHazardRepository(prisma);

export const hazardContainer = {
  getAreaHazardInfoUseCase: () => new GetAreaHazardInfoUseCase(hazardRepository),
  getRegionDisasterHistoryUseCase: () => new GetRegionDisasterHistoryUseCase(hazardRepository),
};
