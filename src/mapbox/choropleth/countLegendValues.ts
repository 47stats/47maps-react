import type { FeatureCollection } from "geojson";
import type { LegendType } from "../legend";

export const countLegendValues = (
  legend: LegendType[],
  geojson: FeatureCollection | undefined,
  columnName: string | undefined,
): LegendType[] => {
  if (!geojson || !columnName) {
    return legend.map((item) => ({ ...item }));
  }

  const counted = legend.map((item) => ({ ...item, count: 0 }));
  geojson.features.forEach((feature) => {
    const value = feature.properties?.[columnName];
    if (value === null || value === undefined || value === "") return;

    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return;

    const rank = counted.find((item) => numericValue >= item.min);
    if (rank) rank.count += 1;
  });

  return counted;
};
