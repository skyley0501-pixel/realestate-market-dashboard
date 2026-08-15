import { predictionContainer } from "@/features/prediction/infrastructure/container";
import { toPredictionResultDto } from "@/features/prediction/presentation/mappers/prediction-result.mapper";
import { badRequest, handleRouteError } from "@/shared/infrastructure/http/handle-route-error";
import { createRequestId } from "@/shared/infrastructure/http/request-id";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const PredictPriceRequestSchema = z.object({
  municipalityCode: z.string().min(1),
  areaSqm: z.coerce.number().positive(),
  buildingAgeYears: z.coerce.number().int().nonnegative(),
  timeToStationMinutes: z.coerce.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const requestId = createRequestId();

  const parsed = PredictPriceRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error, requestId);
  }

  const useCase = predictionContainer.getPredictPriceUseCase();
  const result = await useCase.execute(parsed.data);

  return result.match(
    (predictionResult) => NextResponse.json({ data: toPredictionResultDto(predictionResult) }),
    (error) => handleRouteError(error, requestId),
  );
}
