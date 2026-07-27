"use client";

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// neutral-900相当。既存のshadcn/ui neutralテーマ（--primary）に合わせた単色（単一系列のため凡例は表示しない）
const BAR_COLOR = "#171717";

export interface FloorPlanDistributionChartProps {
  labels: string[]; // 間取り（例: "2LDK"）。件数の多い順
  counts: number[]; // labelsと対応する取引件数
}

export function FloorPlanDistributionChart({ labels, counts }: FloorPlanDistributionChartProps) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "件数",
            data: counts,
            backgroundColor: BAR_COLOR,
            borderRadius: 4,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}件`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      }}
    />
  );
}
