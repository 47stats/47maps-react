export * from "./ChoroplethMap";

export const LAYER_ID = {
  LINE: "m47-line",
  FILL: "m47-fill",
  EXTR: "m47-extrusion",
} as const satisfies Record<string, string>;
