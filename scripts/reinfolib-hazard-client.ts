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

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1秒→2秒→4秒の指数バックオフ

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 該当タイル内に区域・履歴が無い場合は404で返るケースがあるため、その場合は空featuresとして扱う。
// DNS解決失敗・接続タイムアウト等の一時的なネットワークエラーは最大MAX_RETRIES回まで再試行する
// （117市区町村×複数タイルの大量リクエストのため、瞬断で処理全体を止めないようにする）。
export async function fetchHazardTileFeatures(
  apiId: string,
  tile: TileCoord,
  apiKey: string,
  extraParams?: Record<string, string>,
): Promise<GeoJsonFeatureCollection["features"]> {
  const url = buildHazardTileUrl(apiId, tile, extraParams);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
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
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.warn(`  [リトライ ${attempt + 1}/${MAX_RETRIES}] ${url}: ${String(error)}（${delay}ms待機）`);
      await sleep(delay);
    }
  }

  throw new Error("unreachable");
}
