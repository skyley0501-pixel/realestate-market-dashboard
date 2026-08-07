"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AREA_SQM_RANGES,
  BUILDING_AGE_RANGES,
  PROPERTY_TYPES,
} from "@/features/transaction/domain/constants/transaction-search-filters";
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

// 「指定なし」を表すSelectの内部値。空文字はフォーム値としての「未指定」に使うため、
// Select自体の選択肢としては別の値を用いて区別する
const ALL_VALUE = "__all__";

interface MunicipalityOption {
  code: string;
  name: string;
}

const PRICE_FIELDS: Array<{
  name: keyof TransactionFilterFormValues;
  label: string;
  placeholder: string;
}> = [
  { name: "minPrice", label: "価格下限（円）", placeholder: "例: 30000000" },
  { name: "maxPrice", label: "価格上限（円）", placeholder: "例: 80000000" },
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
  // 間取りの選択肢はデータ実態から動的に取得する。nullは「未取得（読み込み中）」を表す
  const [floorPlans, setFloorPlans] = useState<string[] | null>(null);

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
      buildingAgeRange: searchParams.get("buildingAgeRange") ?? "",
      areaSqmRange: searchParams.get("areaSqmRange") ?? "",
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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/floor-plans", { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data: string[] }) => setFloorPlans(json.data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      });
    return () => controller.abort();
  }, []);

  const visibleMunicipalities = municipalitiesByPrefecture[prefectureCode] ?? [];
  const isLoadingMunicipalities = Boolean(prefectureCode) && !(prefectureCode in municipalitiesByPrefecture);
  const isLoadingFloorPlans = floorPlans === null;

  const onSubmit = (values: TransactionFilterFormValues) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/transactions?${query}` : "/transactions");
  };

  const onReset = () => {
    reset({
      municipalityCode: "",
      propertyType: "",
      floorPlan: "",
      buildingAgeRange: "",
      areaSqmRange: "",
      minPrice: "",
      maxPrice: "",
    });
    setPrefectureCode("");
    router.push("/transactions");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="取引検索フィルタ"
      className="mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="propertyType">種類</Label>
        <Controller
          name="propertyType"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || ALL_VALUE}
              onValueChange={(value) => field.onChange(value === ALL_VALUE ? "" : (value ?? ""))}
            >
              <SelectTrigger id="propertyType" className="w-full">
                <SelectValue>{(value: string | null) => (value === ALL_VALUE ? "指定なし" : value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>指定なし</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="floorPlan">間取り</Label>
        <Controller
          name="floorPlan"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || ALL_VALUE}
              onValueChange={(value) => field.onChange(value === ALL_VALUE ? "" : (value ?? ""))}
            >
              <SelectTrigger id="floorPlan" className="w-full">
                <SelectValue placeholder={isLoadingFloorPlans ? "読み込み中…" : "指定なし"}>
                  {(value: string | null) => (value === ALL_VALUE ? "指定なし" : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>指定なし</SelectItem>
                {(floorPlans ?? []).map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buildingAgeRange">築年数</Label>
        <Controller
          name="buildingAgeRange"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || ALL_VALUE}
              onValueChange={(value) => field.onChange(value === ALL_VALUE ? "" : (value ?? ""))}
            >
              <SelectTrigger id="buildingAgeRange" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    BUILDING_AGE_RANGES.find((range) => range.key === value)?.label ?? "指定なし"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>指定なし</SelectItem>
                {BUILDING_AGE_RANGES.map((range) => (
                  <SelectItem key={range.key} value={range.key}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="areaSqmRange">面積</Label>
        <Controller
          name="areaSqmRange"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || ALL_VALUE}
              onValueChange={(value) => field.onChange(value === ALL_VALUE ? "" : (value ?? ""))}
            >
              <SelectTrigger id="areaSqmRange" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    AREA_SQM_RANGES.find((range) => range.key === value)?.label ?? "指定なし"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>指定なし</SelectItem>
                {AREA_SQM_RANGES.map((range) => (
                  <SelectItem key={range.key} value={range.key}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {PRICE_FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input id={field.name} placeholder={field.placeholder} inputMode="numeric" {...register(field.name)} />
          {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]?.message}</p>}
        </div>
      ))}

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit">検索</Button>
        <Button type="button" variant="outline" onClick={onReset}>
          リセット
        </Button>
      </div>
    </form>
  );
}
