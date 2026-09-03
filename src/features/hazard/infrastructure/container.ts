import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetAreaHazardInfoUseCase } from "../application/use-cases/get-area-hazard-info.usecase";
import { PrismaHazardRepository } from "./prisma-hazard-repository";

const hazardRepository = new PrismaHazardRepository(prisma);

export const hazardContainer = {
  getAreaHazardInfoUseCase: () => new GetAreaHazardInfoUseCase(hazardRepository),
};
