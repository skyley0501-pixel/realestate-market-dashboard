"use client";

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";
import { colorForPrefecture } from "../lib/prefecture-colors";
import type { CondoSupplyDto } from "../mappers/condo-market-trend.mapper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface CondoSupplyChartProps {
  condoSupply: CondoSupplyDto[];
}

// 都道府県ごとに、年度をキーにした着工戸数のマップを作る
function groupByPrefecture(condoSupply: CondoSupplyDto[]) {
  const byPrefecture = new Map<string, { prefectureName: string; byYear: Map<number, number> }>();
  for (const row of condoSupply) {
    const group = byPrefecture.get(row.prefectureCode) ?? { prefectureName: row.prefectureName, byYear: new Map() };
    group.byYear.set(row.fiscalYear, row.unitsStarted);
    byPrefecture.set(row.prefectureCode, group);
  }
  return byPrefecture;
}

export function CondoSupplyChart({ condoSupply }: CondoSupplyChartProps) {
  const theme = useChartTheme();

  const years = [...new Set(condoSupply.map((r) => r.fiscalYear))].sort((a, b) => a - b);
  const byPrefecture = groupByPrefecture(condoSupply);

  return (
    <div className="h-64 sm:h-80">
      <Line
        data={{
          labels: years.map((y) => `${y}年度`),
          datasets: [...byPrefecture.entries()].map(([prefectureCode, group]) => ({
            label: group.prefectureName,
            data: years.map((y) => group.byYear.get(y) ?? null),
            borderColor: colorForPrefecture(prefectureCode),
            backgroundColor: colorForPrefecture(prefectureCode),
            borderWidth: 2,
            pointRadius: 2,
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
                label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}戸`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: theme.text, maxTicksLimit: 8, maxRotation: 0, autoSkip: true },
              grid: { color: theme.grid },
            },
            y: {
              beginAtZero: true,
              ticks: { color: theme.text, callback: (value) => Number(value).toLocaleString("ja-JP") },
              grid: { color: theme.grid },
            },
          },
        }}
      />
    </div>
  );
}
