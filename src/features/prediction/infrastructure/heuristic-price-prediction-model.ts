import type { AreaRepository } from "@/features/market/domain/repositories/area-repository";
import { DomainError } from "@/shared/domain/errors/domain-error";
import { Money } from "@/shared/domain/value-objects/money";
import type { PricePredictionModel } from "../domain/services/price-prediction-model";
import type { PredictionInput } from "../domain/value-objects/prediction-input";
import { PredictionResult } from "../domain/value-objects/prediction-result";

export class AreaNotFoundForPredictionError extends DomainError {
  readonly code = "AREA_NOT_FOUND_FOR_PREDICTION";

  constructor(municipalityCode: string) {
    super(`予測対象エリアの統計データが見つかりません: code=${municipalityCode}`);
  }
}

// 築1年ごとの減価率（上限あり）。中古マンションの一般的な経年減価傾向を単純化した経験則
const BUILDING_AGE_DECAY_RATE_PER_YEAR = 0.01;
const BUILDING_AGE_DECAY_MAX_RATE = 0.5;

// 駅徒歩1分ごとの減価率（上限あり）
const STATION_DISTANCE_DECAY_RATE_PER_MINUTE = 0.005;
const STATION_DISTANCE_DECAY_MAX_RATE = 0.3;

// 市区町村平均坪単価×面積を基準に、築年数・駅距離で補正する統計的モデル（Day39時点はヒューリスティック係数）。
// 将来的にPython製MLサービスへ差し替える際は、この実装をRemoteMlPricePredictionModelに置き換えるだけでよい。
export class HeuristicPricePredictionModel implements PricePredictionModel {
  constructor(private readonly areaRepository: AreaRepository) {}

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const snapshot = await this.areaRepository.findLatestSnapshotByCode(input.municipalityCode);
    if (!snapshot) {
      throw new AreaNotFoundForPredictionError(input.municipalityCode);
    }

    const basePriceYen = snapshot.avgUnitPriceYenPerSqm * input.areaSqm;
    const buildingAgeDecayRate = -Math.min(
      input.buildingAgeYears * BUILDING_AGE_DECAY_RATE_PER_YEAR,
      BUILDING_AGE_DECAY_MAX_RATE,
    );
    const stationDistanceDecayRate = -Math.min(
      input.timeToStationMinutes * STATION_DISTANCE_DECAY_RATE_PER_MINUTE,
      STATION_DISTANCE_DECAY_MAX_RATE,
    );

    const buildingAgeContribution = basePriceYen * buildingAgeDecayRate;
    const stationDistanceContribution = basePriceYen * stationDistanceDecayRate;
    const predictedPriceYen = Math.round(basePriceYen + buildingAgeContribution + stationDistanceContribution);

    return PredictionResult.create({
      predictedPriceYen: Money.fromYen(Math.max(predictedPriceYen, 0)),
      contributions: [
        { label: "エリア相場（面積基準）", amountYen: Math.round(basePriceYen) },
        { label: "築年数による補正", amountYen: Math.round(buildingAgeContribution) },
        { label: "駅距離による補正", amountYen: Math.round(stationDistanceContribution) },
      ],
    });
  }
}
