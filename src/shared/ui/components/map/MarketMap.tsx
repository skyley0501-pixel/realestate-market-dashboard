"use client";

import type { ExpressionSpecification } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

// 1都3県（東京・神奈川・千葉・埼玉）がほぼ収まる中心座標とズームレベル
const KANTO_CENTER: [number, number] = [139.65, 35.65];
const INITIAL_ZOOM = 8.3;
// このズームレベル未満は都道府県単位、以上は市区町村単位で坪単価を色分けする
const GRANULARITY_ZOOM_THRESHOLD = 9;

const MUNICIPALITIES_SOURCE_ID = "municipalities";
const PREFECTURES_SOURCE_ID = "prefectures";

type Granularity = "prefecture" | "municipality";

interface HeatmapCell {
  code: string;
  label: string;
  avgUnitPriceYenPerSqm: number;
}

// dataviz skillの検証済みsequentialパレット（blue、light→dark）を坪単価の色分けに使う。
// データが無いエリア（feature-state未設定）は透明にし、実際の低価格エリアと混同しないようにする
const HEATMAP_FILL_COLOR: ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "avgUnitPriceYenPerSqm"], null],
  "rgba(0,0,0,0)",
  [
    "interpolate",
    ["linear"],
    ["feature-state", "avgUnitPriceYenPerSqm"],
    0,
    "#cde2fb",
    300000,
    "#86b6ef",
    600000,
    "#3987e5",
    1000000,
    "#1c5cab",
    2000000,
    "#0d366b",
  ],
];

// バンドラー環境ではimport.meta.urlベースの既定worker URL解決が空文字列になり、
// GeoJSONの非同期パースが永久に完了しない（isSourceLoadedがfalseのまま）ため明示的に指定する。
// worker本体はscripts/copy-maplibre-workerでpublicにコピーしている
setWorkerUrl("/maplibre-gl-worker.mjs");

async function fetchHeatmapCells(granularity: Granularity): Promise<HeatmapCell[]> {
  const res = await fetch(`/api/map/heatmap?granularity=${granularity}`);
  if (!res.ok) {
    throw new Error(`ヒートマップデータの取得に失敗しました: ${res.status}`);
  }
  const json: { data: HeatmapCell[] } = await res.json();
  return json.data;
}

export function MarketMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
      },
      center: KANTO_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl(), "top-right");

    let currentGranularity: Granularity | null = null;

    async function applyGranularity(granularity: Granularity) {
      if (granularity === currentGranularity) return;
      currentGranularity = granularity;

      const cells = await fetchHeatmapCells(granularity);
      const sourceId = granularity === "municipality" ? MUNICIPALITIES_SOURCE_ID : PREFECTURES_SOURCE_ID;
      for (const cell of cells) {
        map.setFeatureState({ source: sourceId, id: cell.code }, { avgUnitPriceYenPerSqm: cell.avgUnitPriceYenPerSqm });
      }

      map.setLayoutProperty("municipalities-fill", "visibility", granularity === "municipality" ? "visible" : "none");
      map.setLayoutProperty("municipalities-outline", "visibility", granularity === "municipality" ? "visible" : "none");
      map.setLayoutProperty("prefectures-fill", "visibility", granularity === "prefecture" ? "visible" : "none");
      map.setLayoutProperty("prefectures-outline", "visibility", granularity === "prefecture" ? "visible" : "none");
    }

    function granularityForZoom(): Granularity {
      return map.getZoom() >= GRANULARITY_ZOOM_THRESHOLD ? "municipality" : "prefecture";
    }

    map.on("load", () => {
      map.addSource(MUNICIPALITIES_SOURCE_ID, {
        type: "geojson",
        data: "/geo/kanto-municipalities.geojson",
        promoteId: "N03_007",
      });
      map.addSource(PREFECTURES_SOURCE_ID, {
        type: "geojson",
        data: "/geo/kanto-prefectures.geojson",
        promoteId: "prefectureCode",
      });

      map.addLayer({
        id: "municipalities-fill",
        type: "fill",
        source: MUNICIPALITIES_SOURCE_ID,
        paint: { "fill-color": HEATMAP_FILL_COLOR, "fill-opacity": 0.7 },
      });
      map.addLayer({
        id: "municipalities-outline",
        type: "line",
        source: MUNICIPALITIES_SOURCE_ID,
        paint: { "line-color": "#184f95", "line-width": 0.5 },
      });

      map.addLayer({
        id: "prefectures-fill",
        type: "fill",
        source: PREFECTURES_SOURCE_ID,
        paint: { "fill-color": HEATMAP_FILL_COLOR, "fill-opacity": 0.7 },
      });
      map.addLayer({
        id: "prefectures-outline",
        type: "line",
        source: PREFECTURES_SOURCE_ID,
        paint: { "line-color": "#184f95", "line-width": 1.5 },
      });

      void applyGranularity(granularityForZoom());
    });

    map.on("zoomend", () => {
      void applyGranularity(granularityForZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-[600px] w-full rounded-lg border" />;
}
