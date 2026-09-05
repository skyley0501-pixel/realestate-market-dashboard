"use client";

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";
import { colorForPrefecture } from "../lib/prefecture-colors";
import type { CondoMarketStatDto } from "../mappers/condo-market-trend.mapper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface CondoMarketChartProps {
  condoMarketStats: CondoMarketStatDto[];
}

function groupByPrefecture(stats: CondoMarketStatDto[]) {
  const byPrefecture = new Map<string, { prefectureName: string; byPeriod: Map<string, number> }>();
  for (const row of stats) {
    const group = byPrefecture.get(row.prefectureCode) ?? { prefectureName: row.prefectureName, byPeriod: new Map() };
    group.byPeriod.set(row.period, row.medianPriceYen);
    byPrefecture.set(row.prefectureCode, group);
  }
  return byPrefecture;
}

export function CondoMarketChart({ condoMarketStats }: CondoMarketChartProps) {
  const theme = useChartTheme();

  // "YYYYQN"形式は文字列の辞書順=時系列順と一致する
  const periods = [...new Set(condoMarketStats.map((r) => r.period))].sort();
  const byPrefecture = groupByPrefecture(condoMarketStats);

  return (
    <div className="h-64 sm:h-80">
      <Line
        data={{
          labels: periods,
          datasets: [...byPrefecture.entries()].map(([prefectureCode, group]) => ({
            label: group.prefectureName,
            data: periods.map((p) => group.byPeriod.get(p) ?? null),
            borderColor: colorForPrefecture(prefectureCode),
            backgroundColor: colorForPrefecture(prefectureCode),
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.15,
            spanGaps: true,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text } },
            tooltip: {
              ...chartTooltipStyle(theme),
              callbacks: {
                label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}円`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: theme.text, maxTicksLimit: 8, maxRotation: 0, autoSkip: true },
              grid: { color: theme.grid },
            },
            y: {
              beginAtZero: false,
              ticks: { color: theme.text, callback: (value) => Number(value).toLocaleString("ja-JP") },
              grid: { color: theme.grid },
            },
          },
        }}
      />
    </div>
  );
}
