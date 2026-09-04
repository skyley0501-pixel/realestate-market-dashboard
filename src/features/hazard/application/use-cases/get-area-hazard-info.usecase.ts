import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { DisasterHistory } from "../../domain/entities/disaster-history";
import type { HazardZone } from "../../domain/entities/hazard-zone";
import type { HazardRepository, MunicipalityCenter } from "../../domain/repositories/hazard-repository";

const DISASTER_HISTORY_LIMIT = 20;

export interface AreaHazardInfo {
  hazardZone: HazardZone | null;
  disasterHistories: DisasterHistory[];
  center: MunicipalityCenter | null;
}

export interface GetAreaHazardInfoInput {
  municipalityCode: string;
}

export class GetAreaHazardInfoUseCase {
  constructor(private readonly hazardRepository: HazardRepository) {}

  async execute(input: GetAreaHazardInfoInput): Promise<Result<AreaHazardInfo, ApplicationError>> {
    try {
      const [hazardZone, disasterHistories, center] = await Promise.all([
        this.hazardRepository.findHazardZoneByMunicipality(input.municipalityCode),
        this.hazardRepository.findDisasterHistoryByMunicipality(input.municipalityCode, DISASTER_HISTORY_LIMIT),
        this.hazardRepository.findMunicipalityCenter(input.municipalityCode),
      ]);

      return Result.ok({ hazardZone, disasterHistories, center });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "AREA_HAZARD_INFO_FETCH_FAILED",
          `防災情報の取得に失敗しました: ${String(error)}`,
          "防災情報の取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
