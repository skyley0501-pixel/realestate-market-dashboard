import { PrismaAreaRepository } from "@/features/market/infrastructure/prisma-area-repository";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { PredictPriceUseCase } from "../application/use-cases/predict-price.usecase";
import { HeuristicPricePredictionModel } from "./heuristic-price-prediction-model";

// DIコンポジションルート。Route Handlerはここ経由でUseCaseを取得し、具象クラスを知らない。
const areaRepository = new PrismaAreaRepository(prisma);
const pricePredictionModel = new HeuristicPricePredictionModel(areaRepository);

export const predictionContainer = {
  getPredictPriceUseCase: () => new PredictPriceUseCase(pricePredictionModel),
};
