// 1都3県を区別するための固定カラーパレット（dataviz skillのカテゴリカルパレットに準拠）。
// 都道府県コード（JIS X0401）→色の対応。凡例の見た目を安定させるため、データ由来でなく固定で持つ。
export const PREFECTURE_COLORS: Record<string, string> = {
  "13": "#3632b6", // 東京都
  "14": "#e34948", // 神奈川県
  "12": "#16a34a", // 千葉県
  "11": "#d97706", // 埼玉県
};

export const DEFAULT_PREFECTURE_COLOR = "#737373";

export function colorForPrefecture(prefectureCode: string): string {
  return PREFECTURE_COLORS[prefectureCode] ?? DEFAULT_PREFECTURE_COLOR;
}
