import { describe, expect, it } from "vitest";
import { centroidOf, isPointInGeometry } from "./geometry-utils";

// 一辺0.4度四方の正方形（テストで使い回す）
const SQUARE_POLYGON: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [139.0, 35.0],
      [139.4, 35.0],
      [139.4, 35.4],
      [139.0, 35.4],
      [139.0, 35.0],
    ],
  ],
};

describe("centroidOf", () => {
  it("Pointはそのままの座標を返す", () => {
    expect(centroidOf({ type: "Point", coordinates: [139.5, 35.5] })).toEqual([139.5, 35.5]);
  });

  it("Polygonはバウンディングボックスの中心を返す", () => {
    expect(centroidOf(SQUARE_POLYGON)).toEqual([139.2, 35.2]);
  });

  it("MultiPolygonは全ポリゴンをまとめたバウンディングボックスの中心を返す", () => {
    const geometry: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        SQUARE_POLYGON.coordinates,
        [
          [
            [140.0, 36.0],
            [140.2, 36.0],
            [140.2, 36.2],
            [140.0, 36.2],
            [140.0, 36.0],
          ],
        ],
      ],
    };

    expect(centroidOf(geometry)).toEqual([139.6, 35.6]);
  });

  it("LineString等の未対応ジオメトリはnullを返す", () => {
    expect(
      centroidOf({
        type: "LineString",
        coordinates: [
          [139.0, 35.0],
          [139.1, 35.1],
        ],
      }),
    ).toBeNull();
  });
});

describe("isPointInGeometry", () => {
  it("Polygonの内部の点はtrue", () => {
    expect(isPointInGeometry([139.2, 35.2], SQUARE_POLYGON)).toBe(true);
  });

  it("Polygonの外部の点はfalse", () => {
    expect(isPointInGeometry([139.9, 35.9], SQUARE_POLYGON)).toBe(false);
  });

  it("穴（ホール）の中にある点は内包しない扱いになる", () => {
    const withHole: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        SQUARE_POLYGON.coordinates[0],
        [
          [139.15, 35.15],
          [139.25, 35.15],
          [139.25, 35.25],
          [139.15, 35.25],
          [139.15, 35.15],
        ],
      ],
    };

    expect(isPointInGeometry([139.2, 35.2], withHole)).toBe(false); // 穴の中
    expect(isPointInGeometry([139.05, 35.05], withHole)).toBe(true); // 外周内・穴の外
  });

  it("MultiPolygonはいずれかのポリゴン内部に含まれればtrue", () => {
    const geometry: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        SQUARE_POLYGON.coordinates,
        [
          [
            [140.0, 36.0],
            [140.2, 36.0],
            [140.2, 36.2],
            [140.0, 36.2],
            [140.0, 36.0],
          ],
        ],
      ],
    };

    expect(isPointInGeometry([140.1, 36.1], geometry)).toBe(true);
    expect(isPointInGeometry([141.0, 37.0], geometry)).toBe(false);
  });

  it("Point/LineStringは常にfalse（面ではないため内包判定の対象外）", () => {
    expect(isPointInGeometry([139.2, 35.2], { type: "Point", coordinates: [139.2, 35.2] })).toBe(false);
  });
});
