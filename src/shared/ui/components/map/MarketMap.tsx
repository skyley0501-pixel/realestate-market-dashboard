"use client";

import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

// 1都3県（東京・神奈川・千葉・埼玉）がほぼ収まる中心座標とズームレベル
const KANTO_CENTER: [number, number] = [139.65, 35.65];
const INITIAL_ZOOM = 8.3;

const MUNICIPALITIES_SOURCE_ID = "municipalities";

// バンドラー環境ではimport.meta.urlベースの既定worker URL解決が空文字列になり、
// GeoJSONの非同期パースが永久に完了しない（isSourceLoadedがfalseのまま）ため明示的に指定する。
// worker本体はscripts/copy-maplibre-workerでpublicにコピーしている
setWorkerUrl("/maplibre-gl-worker.mjs");

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

    map.on("load", () => {
      map.addSource(MUNICIPALITIES_SOURCE_ID, {
        type: "geojson",
        data: "/geo/kanto-municipalities.geojson",
      });

      map.addLayer({
        id: "municipalities-fill",
        type: "fill",
        source: MUNICIPALITIES_SOURCE_ID,
        paint: { "fill-color": "#2a78d6", "fill-opacity": 0.06 },
      });

      map.addLayer({
        id: "municipalities-outline",
        type: "line",
        source: MUNICIPALITIES_SOURCE_ID,
        paint: { "line-color": "#2a78d6", "line-width": 1 },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-[600px] w-full rounded-lg border" />;
}
