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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// neutral-900相当。既存のshadcn/ui neutralテーマ（--primary）に合わせた単色（単一系列のため凡例は表示しない）
const LINE_COLOR = "#171717";

export interface PriceTrendChartProps {
  labels: string[]; // 例: ["2025Q1", "2025Q2", "2025Q3", "2025Q4"]
  values: number[]; // labelsと対応する価格（円）
  valueLabel?: string;
}

export function PriceTrendChart({ labels, values, valueLabel = "中央値（円）" }: PriceTrendChartProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: valueLabel,
            data: values,
            borderColor: LINE_COLOR,
            backgroundColor: LINE_COLOR,
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
            callbacks: {
              label: (context) => `${valueLabel}: ${Number(context.parsed.y).toLocaleString("ja-JP")}円`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (value) => Number(value).toLocaleString("ja-JP") },
          },
        },
      }}
    />
  );
}
