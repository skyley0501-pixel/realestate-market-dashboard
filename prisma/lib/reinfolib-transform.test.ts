// data/reinfolib/*.json（実APIキーが必要）が無くても検証できるよう、
// APIマニュアル記載のフィールド例に基づく合成データで変換ロジックを単体テストする。
import { describe, expect, it } from "vitest";
import {
  parseArea,
  parseBuildingYear,
  parsePeriod,
  parseTradePrice,
  transformRecords,
} from "./reinfolib-transform";
import type { ReinfolibTransactionRecord } from "../../scripts/fetch-reinfolib";

describe("parseBuildingYear", () => {
  it("西暦表記をそのまま数値化する", () => {
    expect(parseBuildingYear("2005年")).toBe(2005);
  });

  it("和暦表記を西暦に変換する", () => {
    expect(parseBuildingYear("昭和55年")).toBe(1980);
    expect(parseBuildingYear("平成1年")).toBe(1989);
    expect(parseBuildingYear("令和5年")).toBe(2023);
  });

  it("戦前・未指定はnullを返す", () => {
    expect(parseBuildingYear("戦前")).toBeNull();
    expect(parseBuildingYear(undefined)).toBeNull();
  });
});

describe("parsePeriod", () => {
  it("四半期表記をYYYYQN形式に変換する", () => {
    expect(parsePeriod("2015年第2四半期")).toBe("2015Q2");
  });

  it("形式不一致はnullを返す", () => {
    expect(parsePeriod("不明")).toBeNull();
  });
});

describe("parseTradePrice", () => {
  it("カンマ混入を許容してBigInt化する", () => {
    expect(parseTradePrice("85,000,000")).toBe(85000000n);
    expect(parseTradePrice("85000000")).toBe(85000000n);
  });
});

describe("parseArea", () => {
  it("「以上」表記は下限値として数値化する", () => {
    expect(parseArea("180")).toBe(180);
    expect(parseArea("2000㎡以上")).toBe(2000);
  });
});

describe("transformRecords", () => {
  it("正常なレコードをTransaction/Municipalityに変換する", () => {
    const record: ReinfolibTransactionRecord = {
      Type: "中古マンション等",
      MunicipalityCode: "13113",
      Prefecture: "東京都",
      Municipality: "渋谷区",
      TradePrice: "85000000",
      Area: "70",
      FloorPlan: "3LDK",
      BuildingYear: "2005年",
      Structure: "RC",
      Use: "住宅",
      Period: "2015年第2四半期",
    };

    const result = transformRecords([record]);

    expect(result.skipped).toBe(0);
    expect(result.transactions).toEqual([
      {
        municipalityCode: "13113",
        transactionPeriod: "2015Q2",
        propertyType: "中古マンション等",
        priceYen: 85000000n,
        areaSqm: 70,
        floorPlan: "3LDK",
        buildingYear: 2005,
        structure: "RC",
        use: "住宅",
        remarks: null,
      },
    ]);
    expect(result.municipalities.get("13113")).toEqual({
      code: "13113",
      name: "渋谷区",
      prefectureCode: "13",
      prefectureName: "東京都",
    });
  });

  it("価格・面積・時期が欠損しているレコードはスキップする", () => {
    const invalid: ReinfolibTransactionRecord = {
      Type: "宅地(土地)",
      MunicipalityCode: "13113",
      Prefecture: "東京都",
      Municipality: "渋谷区",
      TradePrice: "",
      Area: undefined,
      Period: "不明",
    };

    const result = transformRecords([invalid]);

    expect(result.skipped).toBe(1);
    expect(result.transactions).toHaveLength(0);
  });
});
