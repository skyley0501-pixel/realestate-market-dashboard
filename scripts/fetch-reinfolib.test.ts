import { describe, expect, it } from "vitest";
import { filterByTargetCities, type ReinfolibTransactionRecord } from "./fetch-reinfolib";

function buildRecord(municipality: string): ReinfolibTransactionRecord {
  return {
    Type: "中古マンション等",
    MunicipalityCode: "14101",
    Prefecture: "神奈川県",
    Municipality: municipality,
    TradePrice: "50000000",
    Period: "2025年第3四半期",
  };
}

describe("filterByTargetCities", () => {
  it("対象都市名が空配列の場合は全件をそのまま返す", () => {
    const records = [buildRecord("横浜市鶴見区"), buildRecord("藤沢市")];

    expect(filterByTargetCities(records, [])).toEqual(records);
  });

  it("指定都市（ワード制）は市区町村名の前方一致で全ワードを拾う", () => {
    const records = [
      buildRecord("横浜市鶴見区"),
      buildRecord("横浜市神奈川区"),
      buildRecord("藤沢市"),
    ];

    const result = filterByTargetCities(records, ["横浜市"]);

    expect(result.map((r) => r.Municipality)).toEqual(["横浜市鶴見区", "横浜市神奈川区"]);
  });

  it("ワード制ではない市はそのまま完全一致で拾う", () => {
    const records = [buildRecord("藤沢市"), buildRecord("鎌倉市")];

    const result = filterByTargetCities(records, ["藤沢市"]);

    expect(result.map((r) => r.Municipality)).toEqual(["藤沢市"]);
  });

  it("複数の対象都市をOR条件で拾う", () => {
    const records = [buildRecord("横浜市鶴見区"), buildRecord("藤沢市"), buildRecord("鎌倉市")];

    const result = filterByTargetCities(records, ["横浜市", "藤沢市"]);

    expect(result.map((r) => r.Municipality)).toEqual(["横浜市鶴見区", "藤沢市"]);
  });
});
