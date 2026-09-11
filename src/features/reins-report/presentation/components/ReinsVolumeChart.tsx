"use client";

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";
import { seriesColor } from "@/shared/ui/lib/chart-colors";
import { formatPeriodLabel, type ReinsMarketStatDto } from "../mappers/reins-report.mapper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ReinsVolumeChartProps {
  history: ReinsMarketStatDto[];
}

// 成約件数（左軸）と在庫件数（右軸）は規模が大きく異なるため2軸で重ねて表示する
export function ReinsVolumeChart({ history }: ReinsVolumeChartProps) {
  const theme = useChartTheme();

  const labels = history.map((h) => formatPeriodLabel(h.period));
  const contractColor = seriesColor(0, theme.mode);
  const inventoryColor = seriesColor(1, theme.mode);

  return (
    <div className="h-64 sm:h-80">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "成約件数（件）",
              data: history.map((h) => h.contractCount),
              borderColor: contractColor,
              backgroundColor: contractColor,
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.15,
              yAxisID: "y",
            },
            {
              label: "在庫件数（件）",
              data: history.map((h) => h.inventoryCount),
              borderColor: inventoryColor,
              backgroundColor: inventoryColor,
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.15,
              yAxisID: "y1",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text } },
            tooltip: {
              ...chartTooltipStyle(theme),
              callbacks: {
                label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: theme.text, maxTicksLimit: 8, maxRotation: 0, autoSkip: true },
              grid: { color: theme.grid },
            },
            y: {
              position: "left",
              ticks: { color: theme.text, callback: (value) => Number(value).toLocaleString("ja-JP") },
              grid: { color: theme.grid },
              title: { display: true, text: "成約件数", color: theme.text },
            },
            y1: {
              position: "right",
              ticks: { color: theme.text, callback: (value) => Number(value).toLocaleString("ja-JP") },
              grid: { display: false },
              title: { display: true, text: "在庫件数", color: theme.text },
            },
          },
        }}
      />
    </div>
  );
}
