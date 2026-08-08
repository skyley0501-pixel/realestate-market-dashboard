import type { AreaSnapshotDto } from "../mappers/area-snapshot.mapper";

// 対象4都県の表示順（データベースの内容によらず変動しないマスタのため定数として持つ）
const PREFECTURE_ORDER = ["13", "14", "12", "11"];

interface DesignatedCityRange {
  label: string;
  minCode: number;
  maxCode: number;
}

// 政令指定都市・特別区の市区町村コード範囲（JIS X0402の5桁コード。データベースの内容によらず
// 変動しないマスタのため定数として持つ）。表示順が優先順位を兼ねる
const DESIGNATED_CITY_RANGES: Record<string, DesignatedCityRange[]> = {
  "13": [{ label: "23区", minCode: 13101, maxCode: 13123 }],
  "14": [
    { label: "横浜市", minCode: 14101, maxCode: 14118 },
    { label: "川崎市", minCode: 14131, maxCode: 14137 },
    { label: "相模原市", minCode: 14151, maxCode: 14153 },
  ],
  "12": [{ label: "千葉市", minCode: 12101, maxCode: 12106 }],
  "11": [{ label: "さいたま市", minCode: 11101, maxCode: 11110 }],
};

const OTHER_AREAS_LABEL: Record<string, string> = {
  "13": "その他市区町村",
  "14": "その他市",
  "12": "その他市",
  "11": "その他市",
};

export interface AreaSubGroup {
  label: string;
  areas: AreaSnapshotDto[];
}

export interface PrefectureGroup {
  prefectureCode: string;
  prefectureName: string;
  subGroups: AreaSubGroup[];
}

function byUnitPriceDesc(a: AreaSnapshotDto, b: AreaSnapshotDto): number {
  return b.avgUnitPriceYenPerSqm - a.avgUnitPriceYenPerSqm;
}

function groupBySubArea(prefectureCode: string, areas: AreaSnapshotDto[]): AreaSubGroup[] {
  const ranges = DESIGNATED_CITY_RANGES[prefectureCode] ?? [];
  const cityGroups = ranges.map((range) => ({ label: range.label, areas: [] as AreaSnapshotDto[] }));
  const rest: AreaSnapshotDto[] = [];

  for (const area of areas) {
    const code = Number(area.code);
    const rangeIndex = ranges.findIndex((range) => code >= range.minCode && code <= range.maxCode);
    if (rangeIndex >= 0) {
      cityGroups[rangeIndex].areas.push(area);
    } else {
      rest.push(area);
    }
  }

  for (const group of cityGroups) group.areas.sort(byUnitPriceDesc);
  rest.sort(byUnitPriceDesc);

  const otherLabel = OTHER_AREAS_LABEL[prefectureCode] ?? "その他";
  return [...cityGroups.filter((group) => group.areas.length > 0), ...(rest.length > 0 ? [{ label: otherLabel, areas: rest }] : [])];
}

// 都道府県ごとにグループ化し、政令指定都市・特別区は個別のサブグループ（坪単価順）、
// それ以外の市区町村は「その他」サブグループ（坪単価順）にまとめる
export function groupAreasByPrefecture(areas: AreaSnapshotDto[]): PrefectureGroup[] {
  const byPrefecture = new Map<string, { prefectureName: string; areas: AreaSnapshotDto[] }>();
  for (const area of areas) {
    const group = byPrefecture.get(area.prefectureCode);
    if (group) {
      group.areas.push(area);
    } else {
      byPrefecture.set(area.prefectureCode, { prefectureName: area.prefectureName, areas: [area] });
    }
  }

  const orderedCodes = [
    ...PREFECTURE_ORDER,
    ...[...byPrefecture.keys()].filter((code) => !PREFECTURE_ORDER.includes(code)),
  ];

  return orderedCodes.flatMap((prefectureCode) => {
    const group = byPrefecture.get(prefectureCode);
    if (!group) return [];
    return [
      {
        prefectureCode,
        prefectureName: group.prefectureName,
        subGroups: groupBySubArea(prefectureCode, group.areas),
      },
    ];
  });
}
