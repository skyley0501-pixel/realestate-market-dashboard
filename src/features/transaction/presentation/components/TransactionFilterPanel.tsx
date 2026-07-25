"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  TransactionFilterFormSchema,
  type TransactionFilterFormValues,
} from "../schemas/transaction-filter-form.schema";

const FIELDS: Array<{
  name: keyof TransactionFilterFormValues;
  label: string;
  placeholder: string;
  inputMode?: "numeric";
}> = [
  { name: "municipalityCode", label: "市区町村コード", placeholder: "例: 13113" },
  { name: "propertyType", label: "種類", placeholder: "例: 中古マンション等" },
  { name: "floorPlan", label: "間取り", placeholder: "例: 3LDK" },
  { name: "minPrice", label: "価格下限（円）", placeholder: "例: 30000000", inputMode: "numeric" },
  { name: "maxPrice", label: "価格上限（円）", placeholder: "例: 80000000", inputMode: "numeric" },
];

export function TransactionFilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFilterFormValues>({
    resolver: zodResolver(TransactionFilterFormSchema),
    defaultValues: {
      municipalityCode: searchParams.get("municipalityCode") ?? "",
      propertyType: searchParams.get("propertyType") ?? "",
      floorPlan: searchParams.get("floorPlan") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
    },
  });

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
    router.push("/transactions");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="取引検索フィルタ"
      className="mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-5"
    >
      {FIELDS.map((field) => (
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
