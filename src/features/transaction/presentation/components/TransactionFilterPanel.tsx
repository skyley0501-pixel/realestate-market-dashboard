"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  TransactionFilterFormSchema,
  type TransactionFilterFormValues,
} from "../schemas/transaction-filter-form.schema";

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

const OTHER_FIELDS: Array<{
  name: keyof TransactionFilterFormValues;
  label: string;
  placeholder: string;
  inputMode?: "numeric";
}> = [
  { name: "propertyType", label: "種類", placeholder: "例: 中古マンション等" },
  { name: "floorPlan", label: "間取り", placeholder: "例: 3LDK" },
  { name: "minPrice", label: "価格下限（円）", placeholder: "例: 30000000", inputMode: "numeric" },
  { name: "maxPrice", label: "価格上限（円）", placeholder: "例: 80000000", inputMode: "numeric" },
];

// 市区町村コード（JIS X 0402）の先頭2桁が都道府県コードと一致する
function prefectureCodeOf(municipalityCode: string): string {
  return municipalityCode.length >= 2 ? municipalityCode.slice(0, 2) : "";
}

export function TransactionFilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMunicipalityCode = searchParams.get("municipalityCode") ?? "";

  const [prefectureCode, setPrefectureCode] = useState(prefectureCodeOf(initialMunicipalityCode));
  // 都道府県コードごとに取得済みの市区町村一覧をキャッシュする。キーが無ければ「未取得（読み込み中）」を表す
  const [municipalitiesByPrefecture, setMunicipalitiesByPrefecture] = useState<
    Record<string, MunicipalityOption[]>
  >({});

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFilterFormValues>({
    resolver: zodResolver(TransactionFilterFormSchema),
    defaultValues: {
      municipalityCode: initialMunicipalityCode,
      propertyType: searchParams.get("propertyType") ?? "",
      floorPlan: searchParams.get("floorPlan") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
    },
  });

  useEffect(() => {
    if (!prefectureCode || prefectureCode in municipalitiesByPrefecture) return;
    const controller = new AbortController();
    fetch(`/api/municipalities?prefectureCode=${prefectureCode}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data: MunicipalityOption[] }) => {
        setMunicipalitiesByPrefecture((prev) => ({ ...prev, [prefectureCode]: json.data }));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      });
    return () => controller.abort();
  }, [prefectureCode, municipalitiesByPrefecture]);

  const visibleMunicipalities = municipalitiesByPrefecture[prefectureCode] ?? [];
  const isLoadingMunicipalities = Boolean(prefectureCode) && !(prefectureCode in municipalitiesByPrefecture);

  const onSubmit = (values: TransactionFilterFormValues) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/transactions?${query}` : "/transactions");
  };

  const onReset = () => {
    reset({ municipalityCode: "", propertyType: "", floorPlan: "", minPrice: "", maxPrice: "" });
    setPrefectureCode("");
    router.push("/transactions");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="取引検索フィルタ"
      className="mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-5"
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
              {(value: string | null) => PREFECTURES.find((pref) => pref.code === value)?.name ?? "選択してください"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PREFECTURES.map((pref) => (
              <SelectItem key={pref.code} value={pref.code}>
                {pref.name}
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
            <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={!prefectureCode}>
              <SelectTrigger id="municipalityCode" className="w-full">
                <SelectValue
                  placeholder={
                    !prefectureCode
                      ? "都道府県を選択"
                      : isLoadingMunicipalities
                        ? "読み込み中…"
                        : "選択してください"
                  }
                >
                  {(value: string | null) => visibleMunicipalities.find((m) => m.code === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {!isLoadingMunicipalities && visibleMunicipalities.length === 0 ? (
                  <SelectItem value="" disabled>
                    データがまだありません
                  </SelectItem>
                ) : (
                  visibleMunicipalities.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.municipalityCode && (
          <p className="text-xs text-destructive">{errors.municipalityCode.message}</p>
        )}
      </div>

      {OTHER_FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            placeholder={field.placeholder}
            inputMode={field.inputMode}
            {...register(field.name)}
          />
          {errors[field.name] && (
            <p className="text-xs text-destructive">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}
      <div className="flex items-end gap-2 sm:col-span-5">
        <Button type="submit">検索</Button>
        <Button type="button" variant="outline" onClick={onReset}>
          リセット
        </Button>
      </div>
    </form>
  );
}
