import { describe, expect, it } from "vitest";
import type { DisasterHistoryDto } from "../mappers/area-hazard-info.mapper";
import { toFeatureCollection } from "./DisasterHistoryMap";

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
