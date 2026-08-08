"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { groupAreasByPrefecture } from "../lib/area-grouping";
import type { AreaSnapshotDto } from "../mappers/area-snapshot.mapper";

export interface AreaMultiSelectorProps {
  areas: AreaSnapshotDto[];
  selectedCodes: string[];
  min: number;
  max: number;
  href: string; // 選択確定後の遷移先ベースパス（?codes=... を付与する）
}

// サブグループ見出し（例:「横浜市」）と重複する市区町村名の先頭部分は表示上省略する
function areaDisplayName(area: AreaSnapshotDto, subGroupLabel: string): string {
  return area.name.startsWith(subGroupLabel) ? area.name.slice(subGroupLabel.length) : area.name;
}

export function AreaMultiSelector({ areas, selectedCodes, min, max, href }: AreaMultiSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedCodes);
  const groups = groupAreasByPrefecture(areas);

  function toggle(code: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) {
        return prev.length >= max ? prev : [...prev, code];
      }
      return prev.filter((c) => c !== code);
    });
  }

  function apply() {
    const params = new URLSearchParams();
    if (selected.length > 0) params.set("codes", selected.join(","));
    const query = params.toString();
    router.push(query ? `${href}?${query}` : href);
  }

  const canApply = selected.length >= min;

  return (
    <div className="mb-8 rounded-lg border p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        比較したいエリアを{min}〜{max}件選択してください（{selected.length}件選択中）
      </p>
      {groups.map((group) => (
        <div key={group.prefectureCode} className="mb-4 last:mb-0">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{group.prefectureName}</h3>
          {group.subGroups.map((subGroup) => (
            <div key={subGroup.label} className="mb-3 pl-3 last:mb-0">
              <h4 className="mb-2 text-xs text-muted-foreground">{subGroup.label}</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subGroup.areas.map((area) => {
                  const checked = selected.includes(area.code);
                  const disabled = !checked && selected.length >= max;
                  return (
                    <div key={area.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`area-${area.code}`}
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(next) => toggle(area.code, next)}
                      />
                      <Label htmlFor={`area-${area.code}`} className="font-normal">
                        {areaDisplayName(area, subGroup.label)}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
      <Button className="mt-4" onClick={apply} disabled={!canApply}>
        比較する
      </Button>
    </div>
  );
}
