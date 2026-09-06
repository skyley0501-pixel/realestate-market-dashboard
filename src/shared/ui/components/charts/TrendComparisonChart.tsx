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
import { toTsuboPrice } from "@/features/market/presentation/lib/format";
import { chartTooltipStyle, useChartTheme } from "../../lib/chart-theme";
import { seriesColor } from "../../lib/chart-colors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface TrendPoint {
  period: string;
  medianPriceYen: number;
  avgUnitPriceYenPerSqm: number;
  transactionCount: number;
}

export interface TrendSeries {
  code: string;
  label: string; // エリア名
  points: TrendPoint[];
}

export type TrendMetric = keyof Omit<TrendPoint, "period">;

export interface TrendComparisonChartProps {
  series: TrendSeries[];
  metric: TrendMetric;
  unit: string; // ツールチップに付与する単位（例: "円", "円/坪", "件"）
}

// avgUnitPriceYenPerSqmのみ円/㎡ -> 円/坪への変換が必要。Server Componentから関数propsを渡せないため、
// クライアント側でmetricに応じた変換をここに閉じ込める
function displayValue(metric: TrendMetric, raw: number): number {
  return metric === "avgUnitPriceYenPerSqm" ? toTsuboPrice(raw) : raw;
}

export function TrendComparisonChart({ series, metric, unit }: TrendComparisonChartProps) {
  const theme = useChartTheme();
  // 各エリアのデータ収集期間が揃っていない場合に備え、全期間の和集合を昇順で共通X軸にする
  const labels = [...new Set(series.flatMap((s) => s.points.map((p) => p.period)))].sort();

  const datasets = series.map((s, index) => {
    const color = seriesColor(index, theme.mode);
    const valueByPeriod = new Map(s.points.map((p) => [p.period, displayValue(metric, p[metric])]));
    return {
      label: s.label,
      data: labels.map((period) => valueByPeriod.get(period) ?? null),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 4,
      tension: 0.15,
      spanGaps: true,
    };
  });

  return (
    <div className="h-64 sm:h-80">
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: theme.text } },
            tooltip: {
              ...chartTooltipStyle(theme),
              callbacks: {
                label: (context) => `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("ja-JP")}${unit}`,
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
