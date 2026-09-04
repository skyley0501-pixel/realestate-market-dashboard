import type { DisasterHistory } from "../entities/disaster-history";
import type { HazardZone } from "../entities/hazard-zone";

export interface MunicipalityCenter {
  latitude: number;
  longitude: number;
}

// Infrastructure層（PrismaHazardRepository）が実装するPort
export interface HazardRepository {
  // 市区町村の水害・土砂災害リスク該当有無を返す（未取得なら null）
  findHazardZoneByMunicipality(municipalityCode: string): Promise<HazardZone | null>;
  // 市区町村の過去の水害・土砂災害履歴を発生日降順（新しい順）でlimit件返す
  findDisasterHistoryByMunicipality(municipalityCode: string, limit: number): Promise<DisasterHistory[]>;
  // 市区町村の代表点（地図の初期中心に使う）。未設定なら null
  findMunicipalityCenter(municipalityCode: string): Promise<MunicipalityCenter | null>;
}
