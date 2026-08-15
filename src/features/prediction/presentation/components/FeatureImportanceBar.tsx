import { formatYen } from "@/features/market/presentation/lib/format";

interface Contribution {
  label: string;
  amountYen: number;
}

// 各要因が予測価格にプラス/マイナスどれだけ寄与したかを横棒で可視化する
export function FeatureImportanceBar({ contributions }: { contributions: Contribution[] }) {
  const maxAbsAmount = Math.max(...contributions.map((c) => Math.abs(c.amountYen)), 1);

  return (
    <ul className="flex flex-col gap-2">
      {contributions.map((contribution) => {
        const widthPercent = (Math.abs(contribution.amountYen) / maxAbsAmount) * 100;
        const isNegative = contribution.amountYen < 0;
        return (
          <li key={contribution.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{contribution.label}</span>
              <span className={isNegative ? "text-red-600" : "text-emerald-600"}>
                {isNegative ? "" : "+"}
                {formatYen(contribution.amountYen)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${isNegative ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
