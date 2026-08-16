// dataviz skillの検証済みカテゴリカルパレット（8色、隣接ペアでCVD/通常視差のfloorをクリア）。
// 3系列を超えると全ペア検証は通らないため、選択上限は呼び出し側で8に制限する。
// ダークネイビー背景（#060b16）・白背景（#ffffff）双方でWCAG非テキストコントラスト基準（3:1）を
// 満たすよう、色相・彩度は保ったまま明度のみ最小限調整した2バリアントを用意する。
const DARK_SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#5c4bc0", // violet（元#4a3aa7はdark背景でコントラスト2.30のため明度調整）
  "#e34948", // red
];

const LIGHT_SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1aa976", // aqua（元#1baf7aはlight背景でコントラスト2.82のため明度調整）
  "#c88800", // yellow（元#eda100はlight背景でコントラスト2.17のため明度調整）
  "#e56d9a", // magenta（元#e87ba4はlight背景でコントラスト2.69のため明度調整）
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export function seriesColor(index: number, mode: "light" | "dark" = "dark"): string {
  const palette = mode === "dark" ? DARK_SERIES_COLORS : LIGHT_SERIES_COLORS;
  return palette[index % palette.length];
}
