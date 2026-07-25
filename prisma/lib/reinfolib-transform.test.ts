// data/reinfolib/*.json（実APIキーが必要）が無くても検証できるよう、
// APIマニュアル記載のフィールド例に基づく合成データで変換ロジックを単体テストする。
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseArea,
  parseBuildingYear,
  parsePeriod,
  parseTradePrice,
  transformRecords,
} from "./reinfolib-transform.ts";
import type { ReinfolibTransactionRecord } from "../../scripts/fetch-reinfolib.ts";

test("parseBuildingYear: 西暦表記をそのまま数値化する", () => {
  assert.equal(parseBuildingYear("2005年"), 2005);
});

test("parseBuildingYear: 和暦表記を西暦に変換する", () => {
  assert.equal(parseBuildingYear("昭和55年"), 1980);
  assert.equal(parseBuildingYear("平成1年"), 1989);
  assert.equal(parseBuildingYear("令和5年"), 2023);
});

test("parseBuildingYear: 戦前・未指定はnullを返す", () => {
  assert.equal(parseBuildingYear("戦前"), null);
  assert.equal(parseBuildingYear(undefined), null);
});

test("parsePeriod: 四半期表記をYYYYQN形式に変換する", () => {
  assert.equal(parsePeriod("2015年第2四半期"), "2015Q2");
});

test("parsePeriod: 形式不一致はnullを返す", () => {
  assert.equal(parsePeriod("不明"), null);
});

test("parseTradePrice: カンマ混入を許容してBigInt化する", () => {
  assert.equal(parseTradePrice("85,000,000"), 85000000n);
  assert.equal(parseTradePrice("85000000"), 85000000n);
});

test("parseArea: 「以上」表記は下限値として数値化する", () => {
  assert.equal(parseArea("180"), 180);
  assert.equal(parseArea("2000㎡以上"), 2000);
});

test("transformRecords: 正常なレコードをTransaction/Municipalityに変換する", () => {
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

  assert.equal(result.skipped, 0);
  assert.equal(result.transactions.length, 1);
  assert.deepEqual(result.transactions[0], {
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
  });

  const municipality = result.municipalities.get("13113");
  assert.deepEqual(municipality, {
    code: "13113",
    name: "渋谷区",
    prefectureCode: "13",
    prefectureName: "東京都",
  });
});

test("transformRecords: 価格・面積・時期が欠損しているレコードはスキップする", () => {
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

  assert.equal(result.skipped, 1);
  assert.equal(result.transactions.length, 0);
});
