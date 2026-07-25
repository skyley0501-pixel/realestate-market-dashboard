// 不動産情報ライブラリAPI(XIT001)の生レスポンス（文字列中心）を、Transactionテーブルへ投入できる形に変換する純粋関数群。
// DBアクセスを持たないため、実APIキーが無くても単体テストで検証できる。
import type { ReinfolibTransactionRecord } from "../../scripts/fetch-reinfolib";

const ERA_START_YEAR: Record<string, number> = {
  明治: 1868,
  大正: 1912,
  昭和: 1926,
  平成: 1989,
  令和: 2019,
};

// "2005年" / "昭和55年" / "戦前" などをそれぞれ西暦年 / nullへ変換する
export function parseBuildingYear(raw: string | undefined): number | null {
  if (!raw) return null;
  if (raw.includes("戦前")) return null;

  const eraMatch = raw.match(/^(明治|大正|昭和|平成|令和)(\d+)年$/);
  if (eraMatch) {
    const [, era, yearInEra] = eraMatch;
    return ERA_START_YEAR[era] + Number(yearInEra) - 1;
  }

  const westernMatch = raw.match(/^(\d{4})年?$/);
  if (westernMatch) return Number(westernMatch[1]);

  return null;
}

// "2015年第2四半期" -> "2015Q2"
export function parsePeriod(raw: string): string | null {
  const match = raw.match(/^(\d{4})年第(\d)四半期$/);
  if (!match) return null;
  return `${match[1]}Q${match[2]}`;
}

// "85000000" 等の数値文字列（カンマ混入の可能性を許容）をBigInt円に変換する
export function parseTradePrice(raw: string | undefined): bigint | null {
  if (!raw) return null;
  const digits = raw.replace(/[,，]/g, "").trim();
  if (!/^\d+$/.test(digits)) return null;
  return BigInt(digits);
}

// "180" / "2000㎡以上"（大規模地の秘匿表記）等を数値化する。「以上」表記は下限値として扱う
export function parseArea(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/^([\d.]+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function normalizeFloorPlan(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface TransformedTransaction {
  municipalityCode: string;
  transactionPeriod: string;
  propertyType: string;
  priceYen: bigint;
  areaSqm: number;
  floorPlan: string | null;
  buildingYear: number | null;
  structure: string | null;
  use: string | null;
  remarks: string | null;
}

export interface TransformedMunicipality {
  code: string;
  name: string;
  prefectureCode: string;
  prefectureName: string;
}

export interface TransformResult {
  transactions: TransformedTransaction[];
  municipalities: Map<string, TransformedMunicipality>;
  skipped: number;
}

// JIS X0402の市区町村コードは先頭2桁が都道府県コードという規約を利用し、都道府県コードを別APIなしで導出する
function prefectureCodeFromMunicipalityCode(municipalityCode: string): string {
  return municipalityCode.slice(0, 2);
}

export function transformRecords(records: ReinfolibTransactionRecord[]): TransformResult {
  const transactions: TransformedTransaction[] = [];
  const municipalities = new Map<string, TransformedMunicipality>();
  let skipped = 0;

  for (const record of records) {
    const priceYen = parseTradePrice(record.TradePrice);
    const areaSqm = parseArea(record.Area);
    const transactionPeriod = parsePeriod(record.Period);

    if (
      priceYen === null ||
      areaSqm === null ||
      transactionPeriod === null ||
      !record.MunicipalityCode ||
      !record.Municipality ||
      !record.Prefecture
    ) {
      skipped += 1;
      continue;
    }

    municipalities.set(record.MunicipalityCode, {
      code: record.MunicipalityCode,
      name: record.Municipality,
      prefectureCode: prefectureCodeFromMunicipalityCode(record.MunicipalityCode),
      prefectureName: record.Prefecture,
    });

    transactions.push({
      municipalityCode: record.MunicipalityCode,
      transactionPeriod,
      propertyType: record.Type,
      priceYen,
      areaSqm,
      floorPlan: normalizeFloorPlan(record.FloorPlan),
      buildingYear: parseBuildingYear(record.BuildingYear),
      structure: record.Structure ?? null,
      use: record.Use ?? null,
      remarks: record.Remarks ?? null,
    });
  }

  return { transactions, municipalities, skipped };
}
