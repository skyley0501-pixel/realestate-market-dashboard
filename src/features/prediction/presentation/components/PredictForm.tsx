"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PredictionResultDto } from "../mappers/prediction-result.mapper";
import { PredictFormSchema, type PredictFormValues } from "../schemas/predict-form.schema";
import { PredictResultCard } from "./PredictResultCard";

// 対象4都県（データベースの内容によらず変動しないマスタのため定数として持つ）
const PREFECTURES = [
  { code: "13", name: "東京都" },
  { code: "14", name: "神奈川県" },
  { code: "12", name: "千葉県" },
  { code: "11", name: "埼玉県" },
] as const;

interface MunicipalityOption {
  code: string;
  name: string;
}

export function PredictForm() {
  const [prefectureCode, setPrefectureCode] = useState("");
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [result, setResult] = useState<PredictionResultDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PredictFormValues>({
    resolver: zodResolver(PredictFormSchema),
    defaultValues: { municipalityCode: "", areaSqm: "", buildingAgeYears: "", timeToStationMinutes: "" },
  });

  useEffect(() => {
    if (!prefectureCode) return;
    const controller = new AbortController();
    fetch(`/api/municipalities?prefectureCode=${prefectureCode}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data: MunicipalityOption[] }) => setMunicipalities(json.data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      });
    return () => controller.abort();
  }, [prefectureCode]);

  const onSubmit = async (values: PredictFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityCode: values.municipalityCode,
          areaSqm: Number(values.areaSqm),
          buildingAgeYears: Number(values.buildingAgeYears),
          timeToStationMinutes: Number(values.timeToStationMinutes),
        }),
      });
      const body = (await res.json()) as { data?: PredictionResultDto; error?: { message: string } };
      if (!res.ok || !body.data) {
        setErrorMessage(body.error?.message ?? "価格予測に失敗しました。");
        return;
      }
      setResult(body.data);
    } catch {
      setErrorMessage("価格予測に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        aria-label="価格予測フォーム"
        className="flex flex-col gap-4 rounded-lg border p-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prefecture">都道府県</Label>
          <Select
            value={prefectureCode}
            onValueChange={(value) => {
              setPrefectureCode(value ?? "");
              setValue("municipalityCode", "");
            }}
          >
            <SelectTrigger id="prefecture" className="w-full">
              <SelectValue placeholder="選択してください">
                {(value: string | null) => PREFECTURES.find((p) => p.code === value)?.name ?? "選択してください"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PREFECTURES.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="municipalityCode">市区町村</Label>
          <Controller
            name="municipalityCode"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!prefectureCode}>
                <SelectTrigger
                  id="municipalityCode"
                  className="w-full"
                  aria-invalid={!!errors.municipalityCode}
                  aria-describedby={errors.municipalityCode ? "municipalityCode-error" : undefined}
                >
                  <SelectValue placeholder={!prefectureCode ? "都道府県を選択" : "選択してください"}>
                    {(value: string | null) => municipalities.find((m) => m.code === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.municipalityCode && (
            <p id="municipalityCode-error" className="text-xs text-destructive">
              {errors.municipalityCode.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="areaSqm">面積（㎡）</Label>
          <Input
            id="areaSqm"
            placeholder="例: 40"
            inputMode="decimal"
            aria-invalid={!!errors.areaSqm}
            aria-describedby={errors.areaSqm ? "areaSqm-error" : undefined}
            {...register("areaSqm")}
          />
          {errors.areaSqm && (
            <p id="areaSqm-error" className="text-xs text-destructive">
              {errors.areaSqm.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="buildingAgeYears">築年数</Label>
          <Input
            id="buildingAgeYears"
            placeholder="例: 10"
            inputMode="numeric"
            aria-invalid={!!errors.buildingAgeYears}
            aria-describedby={errors.buildingAgeYears ? "buildingAgeYears-error" : undefined}
            {...register("buildingAgeYears")}
          />
          {errors.buildingAgeYears && (
            <p id="buildingAgeYears-error" className="text-xs text-destructive">
              {errors.buildingAgeYears.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timeToStationMinutes">駅からの徒歩分数</Label>
          <Input
            id="timeToStationMinutes"
            placeholder="例: 8"
            inputMode="numeric"
            aria-invalid={!!errors.timeToStationMinutes}
            aria-describedby={errors.timeToStationMinutes ? "timeToStationMinutes-error" : undefined}
            {...register("timeToStationMinutes")}
          />
          <p className="text-xs text-muted-foreground">
            ※ データ提供元（国土交通省 不動産情報ライブラリ）に駅距離の実測データが含まれないため、この項目は実データに基づかない参考値として扱われます。
          </p>
          {errors.timeToStationMinutes && (
            <p id="timeToStationMinutes-error" className="text-xs text-destructive">
              {errors.timeToStationMinutes.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "予測中…" : "価格を予測する"}
        </Button>
      </form>

      <div>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        {result && <PredictResultCard result={result} />}
        {!result && !errorMessage && (
          <p className="text-sm text-muted-foreground">左のフォームに条件を入力して予測してください。</p>
        )}
      </div>
    </div>
  );
}
