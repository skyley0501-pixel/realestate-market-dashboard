import { describe, expect, it } from "vitest";
import { Area } from "./area";

describe("Area", () => {
  const createArea = (code: string, name = "千代田区") =>
    Area.create({ code, name, prefectureCode: "13", prefectureName: "東京都" });

  it("同じcodeを持つAreaはequalsでtrueになる", () => {
    expect(createArea("13101").equals(createArea("13101"))).toBe(true);
  });

  it("名称が変わってもcodeが同じなら同一のエリアとして扱う", () => {
    expect(createArea("13101", "千代田区").equals(createArea("13101", "旧千代田区"))).toBe(true);
  });

  it("codeが異なれば別のエリアとして扱う", () => {
    expect(createArea("13101").equals(createArea("13102"))).toBe(false);
  });
});
