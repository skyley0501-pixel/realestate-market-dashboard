"use client";

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { chartTooltipStyle, useChartTheme } from "@/shared/ui/lib/chart-theme";
import type { InterestRateTrendDto } from "../mappers/interest-rate-trend.mapper";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// 政策金利用の固定色（8色パレットのredと同じ、系列2本の比較なのでカテゴリカルパレットではなく
// 国債＝ブランドカラー、政策金利＝アクセントの2色構成にする）
const POLICY_RATE_COLOR = "#e34948";

export interface InterestRateChartProps {
  trend: InterestRateTrendDto;
}

export function InterestRateChart({ trend }: InterestRateChartProps) {
  const theme = useChartTheme();

  const labels = trend.jgbYields.map((y) => y.date);

  // 政策金利は金融政策決定会合ごとの改定日のみのデータのため、国債の日付軸に対して
  // 「その日時点で最後に適用されていた値」を前方補間し、階段状のグラフとして描画する
  const policyRateSeries = labels.map((date) => {
    const applicable = trend.policyRates.filter((p) => p.effectiveDate <= date);
    return applicable.length > 0 ? applicable[applicable.length - 1].ratePercent : null;
  });

  return (
    // aspectRatioに任せると狭い画面幅では高さが極端に小さくなり潰れて見えるため、
    // コンテナ側で最低限の高さを確保したうえでmaintainAspectRatio: falseにする
    <div className="h-64 sm:h-80">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "国債10年利回り（%）",
              data: trend.jgbYields.map((y) => y.tenYearRate),
              borderColor: theme.line,
              backgroundColor: theme.line,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.1,
            },
            {
              label: "日銀政策金利（%）",
              data: policyRateSeries,
              borderColor: POLICY_RATE_COLOR,
              backgroundColor: POLICY_RATE_COLOR,
              borderWidth: 2,
              pointRadius: 0,
              stepped: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text } },
            tooltip: chartTooltipStyle(theme),
          },
          scales: {
            x: {
              ticks: { color: theme.text, maxTicksLimit: 6, maxRotation: 0, autoSkip: true },
              grid: { color: theme.grid },
            },
            y: { ticks: { color: theme.text, callback: (value) => `${value}%` }, grid: { color: theme.grid } },
          },
        }}
      />
    </div>
  );
}
