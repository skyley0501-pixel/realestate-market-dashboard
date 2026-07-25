import { describe, expect, it } from "vitest";
import { BuildingAge, InvalidBuildingYearError } from "./building-age";

describe("BuildingAge", () => {
  it("基準日と建築年から経過年数を算出する", () => {
    const age = BuildingAge.fromBuildingYear(2005, new Date("2025-06-01"));
    expect(age.years).toBe(20);
    expect(age.isUnknown).toBe(false);
  });

  it("建築年がnullの場合はyearsもnullでisUnknownはtrueになる", () => {
    const age = BuildingAge.fromBuildingYear(null, new Date("2025-06-01"));
    expect(age.years).toBeNull();
    expect(age.isUnknown).toBe(true);
  });

  it("未来の建築年はInvalidBuildingYearErrorを投げる", () => {
    expect(() => BuildingAge.fromBuildingYear(2999, new Date("2025-06-01"))).toThrow(
      InvalidBuildingYearError,
    );
  });

  it("明治元年より前の建築年はInvalidBuildingYearErrorを投げる", () => {
    expect(() => BuildingAge.fromBuildingYear(1800, new Date("2025-06-01"))).toThrow(
      InvalidBuildingYearError,
    );
  });
});
