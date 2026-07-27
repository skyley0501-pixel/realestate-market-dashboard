import { prisma } from "@/shared/infrastructure/prisma/client";
import { GetAreaDetailUseCase } from "../application/use-cases/get-area-detail.usecase";
import { ListAreasUseCase } from "../application/use-cases/list-areas.usecase";
import { PrismaAreaRepository } from "./prisma-area-repository";

// DIコンポジションルート。Route Handlerはここ経由でUseCaseを取得し、具象クラスを知らない。
const areaRepository = new PrismaAreaRepository(prisma);

export const marketContainer = {
  getListAreasUseCase: () => new ListAreasUseCase(areaRepository),
  getAreaDetailUseCase: () => new GetAreaDetailUseCase(areaRepository),
};
