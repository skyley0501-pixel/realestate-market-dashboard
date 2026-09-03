// 不動産情報ライブラリ「防災情報API」（XKT026:洪水浸水想定区域, XKT029:土砂災害警戒区域,
// XST001:国土調査 災害履歴）共通クライアント。タイル座標（z/x/y）を指定してGeoJSONを取得する。
// 参考: https://www.reinfolib.mlit.go.jp/help/apiManual/
import type { TileCoord } from "./geo-tile-utils.ts";

const REINFOLIB_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external";

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; properties: Record<string, unknown>; geometry: unknown }>;
}

export function buildHazardTileUrl(apiId: string, tile: TileCoord, extraParams?: Record<string, string>): string {
  const url = new URL(`${REINFOLIB_BASE_URL}/${apiId}`);
  url.searchParams.set("response_format", "geojson");
  url.searchParams.set("z", String(tile.z));
  url.searchParams.set("x", String(tile.x));
  url.searchParams.set("y", String(tile.y));
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

// 該当タイル内に区域・履歴が無い場合は404で返るケースがあるため、その場合は空featuresとして扱う
export async function fetchHazardTileFeatures(
  apiId: string,
  tile: TileCoord,
  apiKey: string,
  extraParams?: Record<string, string>,
): Promise<GeoJsonFeatureCollection["features"]> {
  const url = buildHazardTileUrl(apiId, tile, extraParams);
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
  });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`reinfolib hazard API error: ${res.status} ${res.statusText} (${url})`);
  }
  const body = (await res.json()) as GeoJsonFeatureCollection;
  return body.features ?? [];
}
