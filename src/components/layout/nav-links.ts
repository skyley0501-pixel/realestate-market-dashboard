export const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/transactions", label: "取引検索" },
  { href: "/ai/predict", label: "価格予測" },
  { href: "/ai/chat", label: "AIチャット" },
] as const;

export const ANALYSIS_LINKS = [
  { href: "/areas", label: "エリアランキング" },
  { href: "/trends", label: "エリア比較" },
  { href: "/map", label: "マーケットマップ" },
] as const;

export const RELATED_INFO_LINKS = [
  { href: "/rates", label: "金利動向" },
  { href: "/condo-market", label: "マンション市場動向" },
] as const;
