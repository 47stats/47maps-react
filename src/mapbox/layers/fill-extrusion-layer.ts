import type { FillExtrusionLayer } from "mapbox-gl";
import type { LegendType } from "../legend";
import { getInterpolateExpression, getCaseExpression } from "./expression";

export const getFillExtrusionLayer = (
  id: string,
  item: string,
  ...legend: LegendType[]
) => {
  const layer: Omit<FillExtrusionLayer, "source"> = {
    id: id,
    type: "fill-extrusion",
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["get", item],
        ...getInterpolateExpression(legend),
      ],
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-opacity": 0.8,
    },
  };
  return layer;
};

export const getFillExtrusionCaseLayer = (
  id: string,
  item: string,
  ...legend: LegendType[]
) => {
  const max: number = legend[0].max;
  const layer: Omit<FillExtrusionLayer, "source"> = {
    id: id,
    type: "fill-extrusion",
    paint: {
      "fill-extrusion-color": [
        "case",
        // ["==", ["to-string", ["get", item]], ""], "transparent",//(*1)
        ["==", ["to-string", ["get", item]], ""],
        "#FFFFFF",
        [">", ["get", item], max],
        legend[0].color,
        ...getCaseExpression(item, legend),
        "transparent",
      ],
      "fill-extrusion-height": ["get", "h_" + item],
      "fill-extrusion-opacity": 0.8,
    },
  };
  return layer;
};

//(*1)
//fill-extrusion-color renders features in black when set to "transparent" in the stops #7785
//https://github.com/mapbox/mapbox-gl-js/issues/7785
