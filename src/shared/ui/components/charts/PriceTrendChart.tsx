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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface PriceTrendChartProps {
  labels: string[]; // 例: ["2025Q1", "2025Q2", "2025Q3", "2025Q4"]
  values: number[]; // labelsと対応する価格（円）
  valueLabel?: string;
}

export function PriceTrendChart({ labels, values, valueLabel = "中央値（円）" }: PriceTrendChartProps) {
  const theme = useChartTheme();

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: valueLabel,
            data: values,
            borderColor: theme.line,
            backgroundColor: theme.line,
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.15,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...chartTooltipStyle(theme),
            callbacks: {
              label: (context) => `${valueLabel}: ${Number(context.parsed.y).toLocaleString("ja-JP")}円`,
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
