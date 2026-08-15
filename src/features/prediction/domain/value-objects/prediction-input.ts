import { DomainError } from "@/shared/domain/errors/domain-error";

export class InvalidPredictionInputError extends DomainError {
  readonly code = "INVALID_PREDICTION_INPUT";

  constructor(message: string) {
    super(message);
  }
}

export interface PredictionInputProps {
  municipalityCode: string;
  areaSqm: number;
  buildingAgeYears: number;
  timeToStationMinutes: number;
}

// 価格予測フォームの入力値。不変・値による等価性を持つ値オブジェクト。
export class PredictionInput {
  private constructor(private readonly props: PredictionInputProps) {}

  static create(props: PredictionInputProps): PredictionInput {
    if (!props.municipalityCode) {
      throw new InvalidPredictionInputError("市区町村を指定してください");
    }
    if (!Number.isFinite(props.areaSqm) || props.areaSqm <= 0) {
      throw new InvalidPredictionInputError(`不正な面積です: ${props.areaSqm}`);
    }
    if (!Number.isFinite(props.buildingAgeYears) || props.buildingAgeYears < 0) {
      throw new InvalidPredictionInputError(`不正な築年数です: ${props.buildingAgeYears}`);
    }
    if (!Number.isFinite(props.timeToStationMinutes) || props.timeToStationMinutes < 0) {
      throw new InvalidPredictionInputError(`不正な駅距離です: ${props.timeToStationMinutes}`);
    }
    return new PredictionInput(props);
  }

  get municipalityCode(): string {
    return this.props.municipalityCode;
  }

  get areaSqm(): number {
    return this.props.areaSqm;
  }

  get buildingAgeYears(): number {
    return this.props.buildingAgeYears;
  }

  get timeToStationMinutes(): number {
    return this.props.timeToStationMinutes;
  }
}
