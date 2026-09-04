"use client";

import type { ExpressionSpecification, GeoJSONSource } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { DisasterHistoryDto, MunicipalityCenterDto } from "../mappers/area-hazard-info.mapper";

const INITIAL_ZOOM = 11; // fetch-disaster-history.tsのタイル取得ズーム(z=12)に合わせ、市区町村全体が収まる程度
const HISTORY_SOURCE_ID = "disaster-histories";

// 土砂系（がけ崩れ・地すべり・河道閉塞・土石流）は茶系、水系（浸水・堤防決壊・高潮）は青系で塗り分ける
const LANDSLIDE_TYPE_CODES = ["21", "22", "23", "24"];
const LANDSLIDE_COLOR = "#92400e";
const FLOOD_COLOR = "#1c5cab";

const FEATURE_COLOR: ExpressionSpecification = [
  "case",
  ["in", ["get", "disasterTypeCode"], ["literal", LANDSLIDE_TYPE_CODES]],
  LANDSLIDE_COLOR,
  FLOOD_COLOR,
];

// バンドラー環境ではimport.meta.urlベースの既定worker URL解決が空文字列になるため明示的に指定する
setWorkerUrl("/maplibre-gl-worker.mjs");

export interface DisasterHistoryMapProps {
  center: MunicipalityCenterDto;
  histories: DisasterHistoryDto[];
}

export function toFeatureCollection(histories: DisasterHistoryDto[]) {
  return {
    type: "FeatureCollection" as const,
    features: histories
      .filter((h) => h.geometry !== null)
      .map((h) => ({
        type: "Feature" as const,
        // APIレスポンスをそのまま保持したDisasterGeometryをGeoJSON標準の型に変換する
        geometry: h.geometry as unknown as GeoJSON.Geometry,
        properties: {
          disasterTypeCode: h.disasterTypeCode,
          disasterName: h.disasterName,
          occurredOn: h.occurredOn,
          // レイヤーのfilterで使う。["geometry-type"]式のサポート状況に依存しないよう、
          // フィーチャー作成時点でgeometry.typeをプロパティとして複製しておく
          geometryType: (h.geometry as { type: string }).type,
        },
      })),
  };
}

export function DisasterHistoryMap({ center, histories }: DisasterHistoryMapProps) {
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
      center: [center.longitude, center.latitude],
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource(HISTORY_SOURCE_ID, { type: "geojson", data: toFeatureCollection(histories) });

      // Point（がけ崩れ等の地点）
      map.addLayer({
        id: "disaster-points",
        type: "circle",
        source: HISTORY_SOURCE_ID,
        filter: ["==", ["get", "geometryType"], "Point"],
        paint: {
          "circle-radius": 6,
          "circle-color": FEATURE_COLOR,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Polygon/MultiPolygon（浸水域等の範囲）
      map.addLayer({
        id: "disaster-polygons-fill",
        type: "fill",
        source: HISTORY_SOURCE_ID,
        filter: ["in", ["get", "geometryType"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: { "fill-color": FEATURE_COLOR, "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "disaster-polygons-outline",
        type: "line",
        source: HISTORY_SOURCE_ID,
        filter: ["in", ["get", "geometryType"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: { "line-color": FEATURE_COLOR, "line-width": 1 },
      });

      for (const layerId of ["disaster-points", "disaster-polygons-fill"]) {
        map.on("click", layerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const { disasterName, occurredOn } = feature.properties as { disasterName: string; occurredOn: string };
          new Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${disasterName}</strong><br>${occurredOn}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初期表示のみでよく、center/historiesの変化での再構築は不要（エリア詳細ページ遷移時はコンポーネント自体が再マウントされる）
  }, []);

  // データがまだ無い場合はソース差し替え（初回load後にhistoriesが変わるケースへの保険）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(HISTORY_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toFeatureCollection(histories));
  }, [histories]);

  return <div ref={containerRef} className="h-80 w-full rounded-lg border" />;
}
