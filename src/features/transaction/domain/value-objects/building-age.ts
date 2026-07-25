import { DomainError } from "@/shared/domain/errors/domain-error";

const OLDEST_PLAUSIBLE_BUILDING_YEAR = 1868; // 明治元年。国内不動産取引データの建築年の妥当な下限として扱う

export class InvalidBuildingYearError extends DomainError {
  readonly code = "INVALID_BUILDING_YEAR";

  constructor(year: unknown) {
    super(`不正な建築年です: ${String(year)}`);
  }
}

// 築年数（経過年数）を扱う値オブジェクト。建築年が不明な取引データ（戦前表記等）も
// buildingYear=nullとして表現できるようにする。
export class BuildingAge {
  private constructor(
    private readonly buildingYear: number | null,
    private readonly asOf: Date,
  ) {}

  static fromBuildingYear(buildingYear: number | null, asOf: Date = new Date()): BuildingAge {
    if (buildingYear !== null) {
      if (
        !Number.isInteger(buildingYear) ||
        buildingYear < OLDEST_PLAUSIBLE_BUILDING_YEAR ||
        buildingYear > asOf.getFullYear()
      ) {
        throw new InvalidBuildingYearError(buildingYear);
      }
    }
    return new BuildingAge(buildingYear, asOf);
  }

  get years(): number | null {
    if (this.buildingYear === null) return null;
    return this.asOf.getFullYear() - this.buildingYear;
  }

  get isUnknown(): boolean {
    return this.buildingYear === null;
  }
}
