"use client";

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";
import { seriesColor } from "@/shared/ui/lib/chart-colors";
import { formatPeriodLabel, type ReinsMarketStatDto } from "../mappers/reins-report.mapper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ReinsPriceGapChartProps {
  history: ReinsMarketStatDto[];
}

// 成約㎡単価（実際に売れた価格）と新規登録㎡単価（売り出し価格）を重ねて表示し、
// 両者の乖離＝「売り出し価格に対して、どれだけ低い水準でないと売れていないか」を可視化する
export function ReinsPriceGapChart({ history }: ReinsPriceGapChartProps) {
  const theme = useChartTheme();

  const labels = history.map((h) => formatPeriodLabel(h.period));
  const contractColor = seriesColor(0, theme.mode);
  const newListingColor = seriesColor(7, theme.mode);

  return (
    <div className="h-64 sm:h-80">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "成約㎡単価（万円/㎡）",
              data: history.map((h) => h.contractUnitPriceManYen),
              borderColor: contractColor,
              backgroundColor: contractColor,
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.15,
            },
            {
              label: "新規登録㎡単価（万円/㎡）",
              data: history.map((h) => h.newListingUnitPriceManYen),
              borderColor: newListingColor,
              backgroundColor: newListingColor,
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.15,
              borderDash: [5, 3],
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
                label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}万円/㎡`,
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
