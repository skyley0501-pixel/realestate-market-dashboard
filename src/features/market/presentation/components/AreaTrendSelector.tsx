"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AreaSnapshotDto } from "../mappers/area-snapshot.mapper";
import { MAX_TREND_AREAS, MIN_TREND_AREAS } from "../lib/trend-selection";

export function AreaTrendSelector({
  areas,
  selectedCodes,
}: {
  areas: AreaSnapshotDto[];
  selectedCodes: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedCodes);

  function toggle(code: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) {
        return prev.length >= MAX_TREND_AREAS ? prev : [...prev, code];
      }
      return prev.filter((c) => c !== code);
    });
  }

  function apply() {
    const params = new URLSearchParams();
    if (selected.length > 0) params.set("codes", selected.join(","));
    const query = params.toString();
    router.push(query ? `/trends?${query}` : "/trends");
  }

  const canApply = selected.length >= MIN_TREND_AREAS;

  return (
    <div className="mb-8 rounded-lg border p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        比較したいエリアを{MIN_TREND_AREAS}〜{MAX_TREND_AREAS}件選択してください（{selected.length}件選択中）
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const checked = selected.includes(area.code);
          const disabled = !checked && selected.length >= MAX_TREND_AREAS;
          return (
            <div key={area.code} className="flex items-center gap-2">
              <Checkbox
                id={`area-${area.code}`}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(next) => toggle(area.code, next)}
              />
              <Label htmlFor={`area-${area.code}`} className="font-normal">
                {area.prefectureName}
                {area.name}
              </Label>
            </div>
          );
        })}
      </div>
      <Button className="mt-4" onClick={apply} disabled={!canApply}>
        比較する
      </Button>
    </div>
  );
}
