"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const areaByCode = new Map(areas.map((area) => [area.code, area]));

  // 選択中のエリアを含む都道府県は最初から開いておく（それ以外は閉じておき一覧をすっきりさせる）
  const [defaultOpenPrefectures] = useState<string[]>(() =>
    groups.filter((group) => group.subGroups.some((sub) => sub.areas.some((a) => selectedCodes.includes(a.code)))).map((g) => g.prefectureCode),
  );

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
  const selectedAreas = selected.map((code) => areaByCode.get(code)).filter((area): area is AreaSnapshotDto => area != null);

  return (
    <div className="mb-8 rounded-lg border p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        比較したいエリアを{min}〜{max}件選択してください（{selected.length}件選択中）
      </p>
      {selectedAreas.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedAreas.map((area) => (
            <button
              key={area.code}
              type="button"
              onClick={() => toggle(area.code, false)}
              className="rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:opacity-80"
            >
              {area.prefectureName} {area.name} ×
            </button>
          ))}
        </div>
      )}
      <Accordion multiple defaultValue={defaultOpenPrefectures}>
        {groups.map((group) => {
          const selectedInPrefecture = group.subGroups.reduce(
            (count, sub) => count + sub.areas.filter((a) => selected.includes(a.code)).length,
            0,
          );
          return (
            <AccordionItem key={group.prefectureCode} value={group.prefectureCode}>
              <AccordionTrigger>
                {group.prefectureName}
                {selectedInPrefecture > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    （{selectedInPrefecture}件選択中）
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <Button className="mt-4" onClick={apply} disabled={!canApply}>
        比較する
      </Button>
    </div>
  );
}
