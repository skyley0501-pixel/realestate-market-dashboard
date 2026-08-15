import { PredictForm } from "@/features/prediction/presentation/components/PredictForm";

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">AI価格予測</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        エリア・面積・築年数・駅からの距離を入力すると、統計モデルが取引価格を予測します。
      </p>
      <PredictForm />
    </div>
  );
}
