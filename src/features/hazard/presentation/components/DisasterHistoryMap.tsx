"use client";

import type { ExpressionSpecification, GeoJSONSource } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { DisasterHistoryDto, MunicipalityCenterDto } from "../mappers/area-hazard-info.mapper";

const INITIAL_ZOOM = 11; // fetch-disaster-history.tsのタイル取得ズーム(z=12)に合わせ、市区町村全体が収まる程度
const HISTORY_SOURCE_ID = "disaster-histories";
const CENTROID_SOURCE_ID = "disaster-history-centroids";

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

interface DisasterFeatureProperties {
  disasterTypeCode: string;
  disasterName: string;
  occurredOn: string;
  // レイヤーのfilterで使う。["geometry-type"]式のサポート状況に依存しないよう、
  // フィーチャー作成時点でgeometry.typeをプロパティとして複製しておく
  geometryType: string;
}

function toProperties(h: DisasterHistoryDto): DisasterFeatureProperties {
  return {
    disasterTypeCode: h.disasterTypeCode,
    disasterName: h.disasterName,
    occurredOn: h.occurredOn,
    geometryType: (h.geometry as { type: string }).type,
  };
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
        properties: toProperties(h),
      })),
  };
}

// Point/Polygon/MultiPolygonの全頂点からバウンディングボックス中心を求める。
// APIの被害範囲ポリゴンは数十m四方など極端に小さいものが多く、初期ズームでは塗りつぶしが
// 視認できないため、ズームに関わらず見える円マーカー（centroidレイヤー）の座標として使う。
function centroidOf(geometry: GeoJSON.Geometry): [number, number] | null {
  let positions: [number, number][];
  if (geometry.type === "Point") {
    return geometry.coordinates as [number, number];
  }
  if (geometry.type === "Polygon") {
    positions = geometry.coordinates.flat() as [number, number][];
  } else if (geometry.type === "MultiPolygon") {
    positions = geometry.coordinates.flat(2) as [number, number][];
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

export function toCentroidFeatureCollection(histories: DisasterHistoryDto[]) {
  return {
    type: "FeatureCollection" as const,
    features: histories
      .filter((h) => h.geometry !== null)
      .map((h) => ({ h, point: centroidOf(h.geometry as unknown as GeoJSON.Geometry) }))
      .filter((x): x is { h: DisasterHistoryDto; point: [number, number] } => x.point !== null)
      .map(({ h, point }) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: point },
        properties: toProperties(h),
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
      map.addSource(CENTROID_SOURCE_ID, { type: "geojson", data: toCentroidFeatureCollection(histories) });

      // Polygon/MultiPolygon（浸水域等の範囲）。ズームインすると実際の被害範囲が見える
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

      // 全履歴の代表点（Pointはそのまま、Polygon/MultiPolygonは中心）。
      // 被害範囲が小さすぎて塗りつぶしが見えないズームでも、ここで場所を示す
      map.addLayer({
        id: "disaster-centroids",
        type: "circle",
        source: CENTROID_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": FEATURE_COLOR,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      for (const layerId of ["disaster-centroids", "disaster-polygons-fill"]) {
        map.on("click", layerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const { disasterName, occurredOn } = feature.properties as { disasterName: string; occurredOn: string };
          // ページ全体のダークテーマ文字色を引き継いで白飛びしないよう、ポップアップ内は明示的に濃色を指定する
          new Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="color:#1f2937"><strong>${disasterName}</strong><br>${occurredOn}</div>`,
            )
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
    (map.getSource(HISTORY_SOURCE_ID) as GeoJSONSource | undefined)?.setData(toFeatureCollection(histories));
    (map.getSource(CENTROID_SOURCE_ID) as GeoJSONSource | undefined)?.setData(toCentroidFeatureCollection(histories));
  }, [histories]);

  return <div ref={containerRef} className="h-80 w-full rounded-lg border" />;
}
