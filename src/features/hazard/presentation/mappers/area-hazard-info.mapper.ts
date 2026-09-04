import type { AreaHazardInfo } from "../../application/use-cases/get-area-hazard-info.usecase";
import type { DisasterGeometry, DisasterHistory } from "../../domain/entities/disaster-history";
import type { HazardZone } from "../../domain/entities/hazard-zone";

export interface HazardZoneDto {
  floodZone: boolean;
  landslideZone: boolean;
  checkedAt: string; // YYYY-MM-DD
}

export interface DisasterHistoryDto {
  disasterTypeCode: string;
  disasterName: string;
  occurredOn: string; // YYYY-MM-DD
  source: string | null;
  geometry: DisasterGeometry | null;
}

export interface MunicipalityCenterDto {
  latitude: number;
  longitude: number;
}

export interface AreaHazardInfoDto {
  hazardZone: HazardZoneDto | null;
  disasterHistories: DisasterHistoryDto[];
  center: MunicipalityCenterDto | null;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toHazardZoneDto(zone: HazardZone): HazardZoneDto {
  return { floodZone: zone.floodZone, landslideZone: zone.landslideZone, checkedAt: toDateOnly(zone.checkedAt) };
}

function toDisasterHistoryDto(history: DisasterHistory): DisasterHistoryDto {
  return {
    disasterTypeCode: history.disasterTypeCode,
    disasterName: history.disasterName,
    occurredOn: toDateOnly(history.occurredOn),
    source: history.source,
    geometry: history.geometry,
  };
}

export function toAreaHazardInfoDto(info: AreaHazardInfo): AreaHazardInfoDto {
  return {
    hazardZone: info.hazardZone ? toHazardZoneDto(info.hazardZone) : null,
    disasterHistories: info.disasterHistories.map(toDisasterHistoryDto),
    center: info.center,
  };
}
