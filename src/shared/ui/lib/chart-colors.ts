// dataviz skillの検証済みカテゴリカルパレット（8色、隣接ペアでCVD/通常視差のfloorをクリア）。
// 3系列を超えると全ペア検証は通らないため、選択上限は呼び出し側で8に制限する。
export const CATEGORICAL_SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export function seriesColor(index: number): string {
  return CATEGORICAL_SERIES_COLORS[index % CATEGORICAL_SERIES_COLORS.length];
}
