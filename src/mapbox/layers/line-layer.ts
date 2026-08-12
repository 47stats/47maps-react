import type { LineLayer } from "mapbox-gl";

export const getLineLayer = (id: string, color?: string, width?: number) => {
  const layer: Omit<LineLayer, "source"> = {
    id: id,
    type: "line",
    paint: {
      "line-opacity": 1.0,
      "line-color": color || "#C0C0C0",
      "line-width": width || 1,
    },
  };
  return layer;
};
