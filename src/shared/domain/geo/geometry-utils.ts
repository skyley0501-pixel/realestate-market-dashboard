// GeoJSON Point/Polygon/MultiPolygonに対する軽量な幾何計算ユーティリティ（外部GISライブラリ非依存）。
// scripts/（Node.jsバッチ）とsrc/features/hazard/（クライアントコンポーネント）の両方から使う共通ロジックのため
// featureに依存しないsrc/shared/domain配下に置く。

type Position = [number, number]; // [lon, lat]

// Point/Polygon/MultiPolygonの代表点を求める（Pointはそのまま、Polygon/MultiPolygonは
// バウンディングボックス中心。正確な重心ではないが、地図の代表点・簡易カバレッジ判定には十分）
export function centroidOf(geometry: GeoJSON.Geometry): Position | null {
  if (geometry.type === "Point") {
    return geometry.coordinates as Position;
  }

  let positions: Position[];
  if (geometry.type === "Polygon") {
    positions = geometry.coordinates.flat() as Position[];
  } else if (geometry.type === "MultiPolygon") {
    positions = geometry.coordinates.flat(2) as Position[];
  } else {
    return null;
  }
  if (positions.length === 0) return null;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of positions) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

// レイキャスティング法による点-リング内包判定（単一の閉じたリング）
function isPointInRing(point: Position, ring: Position[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Polygon座標（[外周, 穴1, 穴2, ...]）に対する内包判定。穴の中にある場合は内包しない扱い
function isPointInPolygonCoords(point: Position, coordinates: Position[][]): boolean {
  if (coordinates.length === 0) return false;
  if (!isPointInRing(point, coordinates[0])) return false;
  for (let i = 1; i < coordinates.length; i++) {
    if (isPointInRing(point, coordinates[i])) return false;
  }
  return true;
}

// 点がPolygon/MultiPolygonジオメトリの内部にあるかを判定する
export function isPointInGeometry(point: Position, geometry: GeoJSON.Geometry): boolean {
  if (geometry.type === "Polygon") {
    return isPointInPolygonCoords(point, geometry.coordinates as Position[][]);
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as Position[][][]).some((polygonCoords) =>
      isPointInPolygonCoords(point, polygonCoords),
    );
  }
  return false;
}
