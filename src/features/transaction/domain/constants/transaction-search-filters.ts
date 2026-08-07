// 検索フォームの「種類」プルダウンの選択肢。国交省 不動産情報ライブラリAPI由来の固定分類のため定数として持つ。
export const PROPERTY_TYPES = [
  "中古マンション等",
  "宅地(土地と建物)",
  "宅地(土地)",
  "林地",
  "農地",
] as const;

export interface AreaSqmRange {
  key: string;
  label: string;
  minAreaSqm?: number;
  maxAreaSqm?: number; // 上限は含まない（〜未満）
}

// 実データ（首都圏4都県、約2.7万件）の面積分布を分析し、各区分の件数がおおむね均等になるように区切った
// （30未満:約3,200件 / 30-50:約3,800件 / 50-70:約6,800件 / 70-100:約7,600件 / 100-150:約3,800件 / 150以上:約1,700件）
export const AREA_SQM_RANGES: readonly AreaSqmRange[] = [
  { key: "-30", label: "30㎡未満", maxAreaSqm: 30 },
  { key: "30-50", label: "30〜50㎡未満", minAreaSqm: 30, maxAreaSqm: 50 },
  { key: "50-70", label: "50〜70㎡未満", minAreaSqm: 50, maxAreaSqm: 70 },
  { key: "70-100", label: "70〜100㎡未満", minAreaSqm: 70, maxAreaSqm: 100 },
  { key: "100-150", label: "100〜150㎡未満", minAreaSqm: 100, maxAreaSqm: 150 },
  { key: "150-", label: "150㎡以上", minAreaSqm: 150 },
];

export interface BuildingAgeRange {
  key: string;
  label: string;
  minBuildingAgeYears?: number;
  maxBuildingAgeYears?: number;
}

// 実データの築年数分布を分析し、各区分の件数がおおむね均等になるように区切った
// （5年以内:約4,600件 / 6-10年:約2,900件 / 11-20年:約5,300件 / 21-30年:約5,300件 / 31-40年:約2,700件 / 41年以上:約4,900件）
export const BUILDING_AGE_RANGES: readonly BuildingAgeRange[] = [
  { key: "0-5", label: "築5年以内", minBuildingAgeYears: 0, maxBuildingAgeYears: 5 },
  { key: "6-10", label: "築6〜10年", minBuildingAgeYears: 6, maxBuildingAgeYears: 10 },
  { key: "11-20", label: "築11〜20年", minBuildingAgeYears: 11, maxBuildingAgeYears: 20 },
  { key: "21-30", label: "築21〜30年", minBuildingAgeYears: 21, maxBuildingAgeYears: 30 },
  { key: "31-40", label: "築31〜40年", minBuildingAgeYears: 31, maxBuildingAgeYears: 40 },
  { key: "41-", label: "築41年以上", minBuildingAgeYears: 41 },
];

export function findAreaSqmRange(key: string): AreaSqmRange | undefined {
  return AREA_SQM_RANGES.find((range) => range.key === key);
}

export function findBuildingAgeRange(key: string): BuildingAgeRange | undefined {
  return BUILDING_AGE_RANGES.find((range) => range.key === key);
}
