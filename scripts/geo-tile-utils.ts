// 緯度経度⇔タイル座標（Web Mercator, Slippy Map方式）の変換と、GeoJSON Polygon/MultiPolygonから
// 代表点（バウンディングボックス中心）を求める共通ユーティリティ。
// scripts/seed-municipality-centroids.ts, scripts/fetch-hazard-zones.ts, scripts/fetch-disaster-history.tsから使う。

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

// 標準的なSlippy Map（Google/OSM系）のタイル座標計算式
export function lonLatToTile(lon: number, lat: number, z: number): TileCoord {
  const x = Math.floor(((lon + 180) / 360) * 2 ** z);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** z,
  );
  return { z, x, y };
}

// 代表点タイルを中心にした縦横radius枚ずつ（既定1 = 3x3）のタイル一覧を返す。
// 市区町村の代表点だけでは面積が広い区域を見落とすため、周辺タイルも含めて簡易カバレッジを確保する。
export function surroundingTiles(center: TileCoord, radius = 1): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      tiles.push({ z: center.z, x: center.x + dx, y: center.y + dy });
    }
  }
  return tiles;
}

type Position = [number, number]; // [lon, lat]

interface GeoJsonFeatureLike {
  properties: Record<string, unknown>;
  geometry:
    | { type: "Polygon"; coordinates: Position[][] }
    | { type: "MultiPolygon"; coordinates: Position[][][] };
}

// Polygon/MultiPolygonの全頂点からバウンディングボックスの中心を代表点として求める
// （正確な重心ではないが、区域判定用タイルの起点としては十分な精度）
export function boundingBoxCenter(feature: GeoJsonFeatureLike): { longitude: number; latitude: number } {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const rings: Position[][] = feature.geometry.type === "Polygon" ? feature.geometry.coordinates : feature.geometry.coordinates.flat();

  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return { longitude: (minLon + maxLon) / 2, latitude: (minLat + maxLat) / 2 };
}

export type { GeoJsonFeatureLike };
