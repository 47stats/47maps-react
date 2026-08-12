import type { FillLayer } from "mapbox-gl";
import type { LegendType } from "../legend";
import { getInterpolateExpression, getCaseExpression } from "./expression";

export const getBorderCaseLayer = (id: string): Omit<FillLayer, "source"> => {
  const layer: Omit<FillLayer, "source"> = {
    id: id,
    type: "fill",
    paint: {
      "fill-color": "rgba(0,0,0,0)",
      "fill-outline-color": "#7c95b0",
      "fill-opacity": 1,
    },
  };
  return layer;
};

export const getFillInterpolateLayer = (
  id: string,
  item: string,
  ...legend: LegendType[]
): Omit<FillLayer, "source"> => {
  const layer: Omit<FillLayer, "source"> = {
    id: id,
    type: "fill",
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", item],
        ...getInterpolateExpression(legend),
      ],
      "fill-opacity": 0.8,
    },
  };
  return layer;
};

export const getFillCaseLayer = (
  id: string,
  item: string,
  ...legend: LegendType[]
): Omit<FillLayer, "source"> => {
  const max: number = legend[0].max;
  const layer: Omit<FillLayer, "source"> = {
    id: id,
    type: "fill",
    paint: {
      "fill-color": [
        "case",
        ["==", ["to-string", ["get", item]], ""],
        "transparent",
        [">", ["get", item], max],
        legend[0].color,
        ...getCaseExpression(item, legend),
        "transparent",
      ],
      "fill-opacity": 0.8,
    },
  };
  return layer;
};
