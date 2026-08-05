// MarketMapのfill-color expressionと同じ配色ステップ（dataviz skillのsequential blueパレット）
const GRADIENT = "linear-gradient(to right, #cde2fb, #86b6ef, #3987e5, #1c5cab, #0d366b)";

export function HeatmapLegend() {
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
      <span>坪単価（円/㎡）</span>
      <span>低い</span>
      <div aria-hidden className="h-3 w-40 rounded" style={{ background: GRADIENT }} />
      <span>高い</span>
    </div>
  );
}
