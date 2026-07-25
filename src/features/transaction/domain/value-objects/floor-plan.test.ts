import { describe, expect, it } from "vitest";
import { FloorPlan, InvalidFloorPlanError } from "./floor-plan";

describe("FloorPlan", () => {
  it("前後の空白を除去して保持する", () => {
    expect(FloorPlan.fromLabel(" 3LDK ").toString()).toBe("3LDK");
  });

  it("多様な実データ表記をそのまま許容する", () => {
    expect(FloorPlan.fromLabel("2LDK+S").toString()).toBe("2LDK+S");
    expect(FloorPlan.fromLabel("ワンルーム").toString()).toBe("ワンルーム");
  });

  it("同じ表記のFloorPlan同士はequalsでtrueになる", () => {
    expect(FloorPlan.fromLabel("3LDK").equals(FloorPlan.fromLabel("3LDK"))).toBe(true);
    expect(FloorPlan.fromLabel("3LDK").equals(FloorPlan.fromLabel("2LDK"))).toBe(false);
  });

  it("空文字はInvalidFloorPlanErrorを投げる", () => {
    expect(() => FloorPlan.fromLabel("  ")).toThrow(InvalidFloorPlanError);
  });
});
