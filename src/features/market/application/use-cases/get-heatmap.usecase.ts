import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import type { AreaRepository } from "../../domain/repositories/area-repository";

export type HeatmapGranularity = "prefecture" | "municipality";

export interface HeatmapCell {
  code: string;
  label: string;
  avgUnitPriceYenPerSqm: number;
}

export interface GetHeatmapInput {
  granularity: HeatmapGranularity;
}

export class GetHeatmapUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: GetHeatmapInput): Promise<Result<HeatmapCell[], ApplicationError>> {
    if (input.granularity !== "prefecture" && input.granularity !== "municipality") {
      return Result.err(
        new ApplicationError(
          "HEATMAP_INVALID_GRANULARITY",
          `granularityはprefectureまたはmunicipalityである必要があります: ${String(input.granularity)}`,
          "指定された集計粒度は不正です。",
        ),
      );
    }

    try {
      const snapshots = await this.areaRepository.findLatestSnapshots();

      if (input.granularity === "municipality") {
        return Result.ok(
          snapshots.map((s) => ({
            code: s.area.code,
            label: `${s.area.prefectureName}${s.area.name}`,
            avgUnitPriceYenPerSqm: s.avgUnitPriceYenPerSqm,
          })),
        );
      }

      // 市区町村スナップショットを都道府県単位に集約し、坪単価は単純平均を用いる
      const sumsByPrefecture = new Map<string, { label: string; sum: number; count: number }>();
      for (const snapshot of snapshots) {
        const key = snapshot.area.prefectureCode;
        const existing = sumsByPrefecture.get(key);
        if (existing) {
          existing.sum += snapshot.avgUnitPriceYenPerSqm;
          existing.count += 1;
        } else {
          sumsByPrefecture.set(key, {
            label: snapshot.area.prefectureName,
            sum: snapshot.avgUnitPriceYenPerSqm,
            count: 1,
          });
        }
      }
      const cells = [...sumsByPrefecture.entries()].map(([code, { label, sum, count }]) => ({
        code,
        label,
        avgUnitPriceYenPerSqm: sum / count,
      }));
      return Result.ok(cells);
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "HEATMAP_FETCH_FAILED",
          `ヒートマップデータの取得に失敗しました: ${String(error)}`,
          "ヒートマップデータの取得に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }
}
