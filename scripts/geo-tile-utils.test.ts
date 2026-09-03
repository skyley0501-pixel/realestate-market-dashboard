import { describe, expect, it } from "vitest";
import { boundingBoxCenter, lonLatToTile, surroundingTiles, type GeoJsonFeatureLike } from "./geo-tile-utils";

describe("lonLatToTile", () => {
  it("東京駅付近の座標をz=14のタイル座標に変換できる（既知の座標との一致を確認）", () => {
    // 東京駅: 東経139.7671, 北緯35.6812。z=14での既知のタイル座標は(14552, 6451)
    const tile = lonLatToTile(139.7671, 35.6812, 14);

    expect(tile).toEqual({ z: 14, x: 14552, y: 6451 });
  });

  it("ズームレベルが上がるほどタイル座標の値も大きくなる", () => {
    const low = lonLatToTile(139.7671, 35.6812, 10);
    const high = lonLatToTile(139.7671, 35.6812, 14);

    expect(high.x).toBeGreaterThan(low.x);
    expect(high.y).toBeGreaterThan(low.y);
  });
});

describe("surroundingTiles", () => {
  it("radius=1の場合、中心タイルを含む3x3=9枚を返す", () => {
    const tiles = surroundingTiles({ z: 14, x: 100, y: 200 }, 1);

    expect(tiles).toHaveLength(9);
    expect(tiles).toContainEqual({ z: 14, x: 100, y: 200 });
    expect(tiles).toContainEqual({ z: 14, x: 99, y: 199 });
    expect(tiles).toContainEqual({ z: 14, x: 101, y: 201 });
  });

  it("radius=0の場合、中心タイルのみ1枚を返す", () => {
    const tiles = surroundingTiles({ z: 12, x: 5, y: 5 }, 0);

    expect(tiles).toEqual([{ z: 12, x: 5, y: 5 }]);
  });
});

describe("boundingBoxCenter", () => {
  it("Polygonの頂点からバウンディングボックス中心を求められる", () => {
    const feature: GeoJsonFeatureLike = {
      properties: {},
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
    };

    expect(boundingBoxCenter(feature)).toEqual({ longitude: 139.1, latitude: 35.2 });
  });

  it("MultiPolygonは全ポリゴンの頂点をまとめてバウンディングボックスを求める", () => {
    const feature: GeoJsonFeatureLike = {
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [139.0, 35.0],
              [139.1, 35.0],
              [139.1, 35.1],
              [139.0, 35.1],
              [139.0, 35.0],
            ],
          ],
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
      },
    };

    expect(boundingBoxCenter(feature)).toEqual({ longitude: 139.6, latitude: 35.6 });
  });
});
