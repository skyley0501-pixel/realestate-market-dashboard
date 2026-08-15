import { formatYen } from "@/features/market/presentation/lib/format";
import type { PredictionResultDto } from "../mappers/prediction-result.mapper";
import { FeatureImportanceBar } from "./FeatureImportanceBar";

export function PredictResultCard({ result }: { result: PredictionResultDto }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">予測価格</p>
      <p className="mb-4 text-2xl font-bold">{formatYen(result.predictedPriceYen)}</p>
      <h3 className="mb-2 text-sm font-semibold">価格の内訳</h3>
      <FeatureImportanceBar contributions={result.contributions} />
    </div>
  );
}
