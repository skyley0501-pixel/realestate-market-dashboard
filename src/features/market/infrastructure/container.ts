import { conversationContainer } from "@/features/conversation/infrastructure/container";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetAreaDetailUseCase } from "../application/use-cases/get-area-detail.usecase";
import { GetAreaPriceHistoryUseCase } from "../application/use-cases/get-area-price-history.usecase";
import { GetAreaReportUseCase } from "../application/use-cases/get-area-report.usecase";
import { GetDashboardSummaryUseCase } from "../application/use-cases/get-dashboard-summary.usecase";
import { GetHeatmapUseCase } from "../application/use-cases/get-heatmap.usecase";
import { GetTrendsUseCase } from "../application/use-cases/get-trends.usecase";
import { ListAreasUseCase } from "../application/use-cases/list-areas.usecase";
import { PrismaAiAreaReportRepository } from "./prisma-ai-area-report-repository";
import { PrismaAreaRepository } from "./prisma-area-repository";

// DIコンポジションルート。Route Handlerはここ経由でUseCaseを取得し、具象クラスを知らない。
const areaRepository = new PrismaAreaRepository(prisma);
const aiAreaReportRepository = new PrismaAiAreaReportRepository(prisma);

export const marketContainer = {
  getListAreasUseCase: () => new ListAreasUseCase(areaRepository),
  getAreaDetailUseCase: () => new GetAreaDetailUseCase(areaRepository),
  getAreaPriceHistoryUseCase: () => new GetAreaPriceHistoryUseCase(areaRepository),
  getTrendsUseCase: () => new GetTrendsUseCase(areaRepository),
  getHeatmapUseCase: () => new GetHeatmapUseCase(areaRepository),
  getDashboardSummaryUseCase: () => new GetDashboardSummaryUseCase(areaRepository),
  getAreaReportUseCase: () =>
    new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, conversationContainer.getLlmClient()),
};
