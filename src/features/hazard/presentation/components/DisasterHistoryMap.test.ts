import { describe, expect, it } from "vitest";
import type { DisasterHistoryDto } from "../mappers/area-hazard-info.mapper";
import { toCentroidFeatureCollection, toFeatureCollection } from "./DisasterHistoryMap";

function buildHistory(overrides: Partial<DisasterHistoryDto> = {}): DisasterHistoryDto {
  return {
    disasterTypeCode: "11",
    disasterName: "浸水域等",
    occurredOn: "2005-08-31",
    source: null,
    geometry: { type: "Polygon", coordinates: [[[139.0, 35.0]]] },
    ...overrides,
  };
}

describe("toFeatureCollection", () => {
  it("geometryがnullの履歴は除外する", () => {
    const result = toFeatureCollection([buildHistory({ geometry: null })]);

    expect(result.features).toHaveLength(0);
  });

  // MapLibreのレイヤーfilterは["geometry-type"]式に頼らず、properties.geometryTypeで
  // Point/Polygon/MultiPolygonを判定する（filterが機能しない環境があったため確実な方式に変更した）
  it("Point/Polygon双方でgeometry.typeをproperties.geometryTypeに複製する", () => {
    const result = toFeatureCollection([
      buildHistory({ disasterTypeCode: "21", geometry: { type: "Point", coordinates: [139.0, 35.0] } }),
      buildHistory({ disasterTypeCode: "11", geometry: { type: "Polygon", coordinates: [[[139.0, 35.0]]] } }),
      buildHistory({
        disasterTypeCode: "11",
        geometry: { type: "MultiPolygon", coordinates: [[[[139.0, 35.0]]]] },
      }),
    ]);

    expect(result.features.map((f) => f.properties.geometryType)).toEqual(["Point", "Polygon", "MultiPolygon"]);
  });

  it("properties.disasterTypeCode/disasterName/occurredOnも引き継ぐ", () => {
    const result = toFeatureCollection([
      buildHistory({ disasterTypeCode: "24", disasterName: "土石流", occurredOn: "1991-06-03" }),
    ]);

    expect(result.features[0].properties).toMatchObject({
      disasterTypeCode: "24",
      disasterName: "土石流",
      occurredOn: "1991-06-03",
    });
  });
});

describe("toCentroidFeatureCollection", () => {
  // 実際の被害範囲ポリゴンは数十m四方など極小で、初期ズームでは塗りつぶしが視認できないため、
  // ズームに関わらず見える円マーカー用にPolygonの中心点を求める
  it("Polygonはバウンディングボックスの中心点をPoint Featureとして返す", () => {
    const result = toCentroidFeatureCollection([
      buildHistory({
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [139.0, 35.0],
              [139.2, 35.0],
              [139.2, 35.4],
              [139.0, 35.4],
              [139.0, 35.0],
            ],
          ],
        },
      }),
    ]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry).toEqual({ type: "Point", coordinates: [139.1, 35.2] });
  });

  it("Pointはそのままの座標を使う", () => {
    const result = toCentroidFeatureCollection([
      buildHistory({ geometry: { type: "Point", coordinates: [139.5, 35.5] } }),
    ]);

    expect(result.features[0].geometry).toEqual({ type: "Point", coordinates: [139.5, 35.5] });
  });

  it("geometryがnullの履歴は除外する", () => {
    const result = toCentroidFeatureCollection([buildHistory({ geometry: null })]);

    expect(result.features).toHaveLength(0);
  });
});
