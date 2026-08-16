export const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/transactions", label: "取引検索" },
  { href: "/ai/predict", label: "価格予測" },
  { href: "/ai/chat", label: "AIチャット" },
] as const;

export const ANALYSIS_LINKS = [
  { href: "/areas", label: "エリアランキング" },
  { href: "/trends", label: "トレンド分析" },
  { href: "/areas/compare", label: "エリア比較" },
  { href: "/map", label: "マーケットマップ" },
] as const;
