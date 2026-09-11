import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetReinsReportUseCase } from "../application/use-cases/get-reins-report.usecase";
import { PrismaReinsReportRepository } from "./prisma-reins-report-repository";

const reinsReportRepository = new PrismaReinsReportRepository(prisma);

export const reinsReportContainer = {
  getReinsReportUseCase: () => new GetReinsReportUseCase(reinsReportRepository),
};
