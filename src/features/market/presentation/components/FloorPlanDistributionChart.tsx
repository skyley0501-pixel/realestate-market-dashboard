"use client";

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export interface FloorPlanDistributionChartProps {
  labels: string[]; // 間取り（例: "2LDK"）。件数の多い順
  counts: number[]; // labelsと対応する取引件数
}

export function FloorPlanDistributionChart({ labels, counts }: FloorPlanDistributionChartProps) {
  const theme = useChartTheme();

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "件数",
            data: counts,
            backgroundColor: theme.line,
            borderRadius: 4,
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
              label: (context) => `${context.parsed.y}件`,
            },
          },
        },
        scales: {
          x: { ticks: { color: theme.text }, grid: { color: theme.grid } },
          y: { beginAtZero: true, ticks: { color: theme.text, precision: 0 }, grid: { color: theme.grid } },
        },
      }}
    />
  );
}
