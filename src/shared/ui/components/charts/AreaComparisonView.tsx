"use client";

import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { seriesColor } from "../../lib/chart-colors";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface AreaComparisonMetrics {
  code: string;
  label: string; // エリア名
  avgUnitPriceYenPerSqm: number;
  medianPriceYen: number;
  transactionCount: number;
  trendRatePercent: number | null;
}

export interface AreaComparisonViewProps {
  areas: AreaComparisonMetrics[];
}

type AxisKey = "unitPrice" | "medianPrice" | "transactionCount" | "trendRate";

const AXES: { key: AxisKey; label: string; unit: string }[] = [
  { key: "unitPrice", label: "坪単価", unit: "円/㎡" },
  { key: "medianPrice", label: "価格中央値", unit: "円" },
  { key: "transactionCount", label: "取引件数", unit: "件" },
  { key: "trendRate", label: "前期比", unit: "%" },
];

// 前期比は下落（マイナス）もあり得るが、レーダーチャートの軸は0を起点とした相対比較のため0でクランプする
function rawValue(area: AreaComparisonMetrics, key: AxisKey): number {
  switch (key) {
    case "unitPrice":
      return area.avgUnitPriceYenPerSqm;
    case "medianPrice":
      return area.medianPriceYen;
    case "transactionCount":
      return area.transactionCount;
    case "trendRate":
      return Math.max(area.trendRatePercent ?? 0, 0);
  }
}

export function AreaComparisonView({ areas }: AreaComparisonViewProps) {
  // 軸ごとに選択エリア内の最大値を100%とした相対値に正規化する（指標間の単位・スケールが大きく異なるため）
  const axisMax = AXES.map((axis) => Math.max(...areas.map((area) => rawValue(area, axis.key)), 1));

  const datasets = areas.map((area, index) => {
    const color = seriesColor(index);
    return {
      label: area.label,
      data: AXES.map((axis, i) => (rawValue(area, axis.key) / axisMax[i]) * 100),
      borderColor: color,
      backgroundColor: `${color}33`,
      pointBackgroundColor: color,
      borderWidth: 2,
    };
  });

  return (
    <Radar
      data={{ labels: AXES.map((axis) => axis.label), datasets }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => {
                const axis = AXES[context.dataIndex];
                const area = areas[context.datasetIndex];
                const raw = rawValue(area, axis.key);
                return `${context.dataset.label} ${axis.label}: ${raw.toLocaleString("ja-JP")}${axis.unit}`;
              },
            },
          },
        },
        scales: {
          r: { min: 0, max: 100, ticks: { display: false } },
        },
      }}
    />
  );
}
