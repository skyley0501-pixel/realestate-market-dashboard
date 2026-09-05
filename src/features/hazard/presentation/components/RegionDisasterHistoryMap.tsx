"use client";

import { Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { DisasterHistoryDto } from "../mappers/area-hazard-info.mapper";
import { FEATURE_COLOR } from "../lib/disaster-map-style";
import { toCentroidFeatureCollection, toFeatureCollection } from "./DisasterHistoryMap";

// 1都3県（東京・神奈川・千葉・埼玉）がほぼ収まる中心座標とズームレベル。MarketMapと同じ値で統一する
const KANTO_CENTER: [number, number] = [139.65, 35.65];
const INITIAL_ZOOM = 8.3;
const HISTORY_SOURCE_ID = "region-disaster-histories";
const CENTROID_SOURCE_ID = "region-disaster-history-centroids";

setWorkerUrl("/maplibre-gl-worker.mjs");

export interface RegionDisasterHistoryMapProps {
  histories: DisasterHistoryDto[];
}

export function RegionDisasterHistoryMap({ histories }: RegionDisasterHistoryMapProps) {
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
      map.addSource(HISTORY_SOURCE_ID, { type: "geojson", data: toFeatureCollection(histories) });
      map.addSource(CENTROID_SOURCE_ID, { type: "geojson", data: toCentroidFeatureCollection(histories) });

      // Polygon/MultiPolygon（浸水域等の範囲）。ズームインすると実際の被害範囲が見える
      map.addLayer({
        id: "region-disaster-polygons-fill",
        type: "fill",
        source: HISTORY_SOURCE_ID,
        filter: ["in", ["get", "geometryType"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: { "fill-color": FEATURE_COLOR, "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "region-disaster-polygons-outline",
        type: "line",
        source: HISTORY_SOURCE_ID,
        filter: ["in", ["get", "geometryType"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: { "line-color": FEATURE_COLOR, "line-width": 1 },
      });

      // 広域表示では被害範囲が点にしか見えないため、全履歴の代表点を常時表示する
      map.addLayer({
        id: "region-disaster-centroids",
        type: "circle",
        source: CENTROID_SOURCE_ID,
        paint: {
          "circle-radius": 5,
          "circle-color": FEATURE_COLOR,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      for (const layerId of ["region-disaster-centroids", "region-disaster-polygons-fill"]) {
        map.on("click", layerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const { disasterName, occurredOn } = feature.properties as { disasterName: string; occurredOn: string };
          new Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<div style="color:#1f2937"><strong>${disasterName}</strong><br>${occurredOn}</div>`)
            .addTo(map);
        });
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初期表示のみでよく、historiesはページ読み込み時点で確定している
  }, []);

  return <div ref={containerRef} className="h-96 w-full rounded-lg border" />;
}
