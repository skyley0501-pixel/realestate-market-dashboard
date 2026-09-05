import type { ExpressionSpecification } from "maplibre-gl";

// 土砂系（がけ崩れ・地すべり・河道閉塞・土石流）は茶系、水系（浸水・堤防決壊・高潮）は青系で塗り分ける
export const LANDSLIDE_TYPE_CODES = ["21", "22", "23", "24"];
export const LANDSLIDE_COLOR = "#92400e";
export const FLOOD_COLOR = "#1c5cab";

export const FEATURE_COLOR: ExpressionSpecification = [
  "case",
  ["in", ["get", "disasterTypeCode"], ["literal", LANDSLIDE_TYPE_CODES]],
  LANDSLIDE_COLOR,
  FLOOD_COLOR,
];
