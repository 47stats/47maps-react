import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type { LegendType } from "../legend";
import { countLegendValues } from "./countLegendValues";

const legend: LegendType[] = [
  { min: 100, max: 200, count: 9, color: "#f00" },
  { min: 50, max: 100, count: 9, color: "#0f0" },
  { min: 0, max: 50, count: 9, color: "#00f" },
];

const geojson: FeatureCollection = {
  type: "FeatureCollection",
  features: [150, 100, 99, 50, 49, 0, null, ""].map((value) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: { value },
  })),
};

describe("countLegendValues", () => {
  it("選択時点の値を各階級へ数え直す", () => {
    const counted = countLegendValues(legend, geojson, "value");

    expect(counted.map((item) => item.count)).toEqual([2, 2, 2]);
    expect(legend.map((item) => item.count)).toEqual([9, 9, 9]);
  });

  it("ポリゴンが未取得の場合はAPIの件数を維持する", () => {
    expect(countLegendValues(legend, undefined, "value")).toEqual(legend);
  });
});
