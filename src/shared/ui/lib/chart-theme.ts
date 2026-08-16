"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

// globals.cssのデザイントークン（OKLCH）をChart.js用にsRGB固定値化したもの。
// Chart.jsはCSS変数を解釈できないため、テーマ切替時にJS側で色を出し分ける。
const CHART_THEME = {
  light: {
    text: "#737373", // --muted-foreground
    grid: "#e5e5e5", // --border
    line: "#3632b6", // --primary
    tooltipBg: "#ffffff", // --popover
    tooltipText: "#0a0a0a", // --foreground
    tooltipBorder: "#e5e5e5", // --border
  },
  dark: {
    text: "#9199a5",
    grid: "#525e72",
    line: "#535cda",
    tooltipBg: "#121b29",
    tooltipText: "#eff2f6",
    tooltipBorder: "#525e72",
  },
} as const;

const noopSubscribe = () => () => {};

// next-themesはSSR時にテーマを確定できないため、マウント後まで確定値を使わない（ThemeToggleと同じパターン）
function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const mounted = useHasMounted();
  // マウント前・未確定時はレイアウトのdefaultTheme="dark"に合わせておく
  const isDark = !mounted || resolvedTheme !== "light";
  const mode: "light" | "dark" = isDark ? "dark" : "light";
  return { ...(isDark ? CHART_THEME.dark : CHART_THEME.light), mode };
}

export function chartTooltipStyle(theme: ReturnType<typeof useChartTheme>) {
  return {
    backgroundColor: theme.tooltipBg,
    titleColor: theme.tooltipText,
    bodyColor: theme.tooltipText,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    cornerRadius: 8,
    padding: 10,
  };
}
