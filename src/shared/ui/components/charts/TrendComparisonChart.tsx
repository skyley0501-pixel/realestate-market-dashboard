"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "../../lib/chart-theme";
import { seriesColor } from "../../lib/chart-colors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface TrendSeries {
  code: string;
  label: string; // エリア名
  points: { period: string; medianPriceYen: number }[];
}

export interface TrendComparisonChartProps {
  series: TrendSeries[];
}

export function TrendComparisonChart({ series }: TrendComparisonChartProps) {
  const theme = useChartTheme();
  // 各エリアのデータ収集期間が揃っていない場合に備え、全期間の和集合を昇順で共通X軸にする
  const labels = [...new Set(series.flatMap((s) => s.points.map((p) => p.period)))].sort();

  const datasets = series.map((s, index) => {
    const color = seriesColor(index, theme.mode);
    const valueByPeriod = new Map(s.points.map((p) => [p.period, p.medianPriceYen]));
    return {
      label: s.label,
      data: labels.map((period) => valueByPeriod.get(period) ?? null),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 4,
      tension: 0.15,
    };
  });

  return (
    <Line
      data={{ labels, datasets }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { color: theme.text } },
          tooltip: {
            ...chartTooltipStyle(theme),
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}円`,
            },
          },
        },
        scales: {
          x: { ticks: { color: theme.text }, grid: { color: theme.grid } },
          y: {
            beginAtZero: false,
            ticks: { color: theme.text, callback: (value) => Number(value).toLocaleString("ja-JP") },
            grid: { color: theme.grid },
          },
        },
      }}
    />
  );
}
