/**
 * 47maps LocalStorage Data Schema
 * Version 1.0.0
 */

export const STORAGE_SCHEMA_VERSION = "1.0.0";
export const MAX_IMPORT_FILE_SIZE_BYTES = 1024 * 1024;
export const DEFAULT_MAX_MARKETAREA_ITEMS = 20;
export const ABSOLUTE_MAX_MARKETAREA_ITEMS = 100;
export const MAX_AREA_ITEMS = 1000;
export const MAX_COLUMN_ITEMS = 300;
export const MAX_COLUMN_PATH_ITEMS = 20;
export const MAX_LEGEND_ITEMS = 12;

export interface StorageExportData {
  version: string;
  exportedAt: string;
  marketareaItems: MarketareaItemSchema[];
  choroplethSettings: ChoroplethSettingsSchema;
}

export interface MarketareaItemSchema {
  id: string;
  type: "trading" | "isochrone";
  name: string;
  center: {
    lng: number;
    lat: number;
  };
  settings: TradingAreaSettingsSchema | IsochroneSettingsSchema;
  checked: boolean;
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown[];
  };
}

export interface TradingAreaSettingsSchema {
  radius: number;
  color: string;
}

export interface IsochroneSettingsSchema {
  travelMode: "walking" | "cycling" | "driving";
  contourType: "minutes" | "meters";
  range: number;
  color: string;
}

export interface ChoroplethSettingsSchema {
  database: string;
  version: string;
  store: string;
  column: ColumnInfoSchema[];
  columnPath: ColumnPathItemSchema[];
  area: string[];
  maxSelection?: number;
  legendSchemeType?: "sequential" | "diverging" | "qualitative";
  legendRampName?: string;
  legendNumClasses?: number;
  legendData?: LegendDataItemSchema[];
}

export interface ColumnInfoSchema {
  kind: string;
  name: string;
  desc: string;
  unit: string;
  dataType: number;
  length: number;
  scale: number;
  column: string;
  date1: number;
  date2: number;
}

export interface ColumnPathItemSchema {
  class: string;
  name: string;
}

export interface LegendDataItemSchema {
  color: string;
  min: number;
  max: number;
  count: number;
}

const shortString = { type: "string", minLength: 1, maxLength: 256 } as const;
const color = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" } as const;
const position = {
  type: "array",
  minItems: 2,
  maxItems: 2,
  items: [
    { type: "number", minimum: -180, maximum: 180 },
    { type: "number", minimum: -90, maximum: 90 },
  ],
  additionalItems: false,
} as const;
const linearRing = {
  type: "array",
  minItems: 4,
  maxItems: 10000,
  items: position,
} as const;
const polygonCoordinates = {
  type: "array",
  minItems: 1,
  maxItems: 256,
  items: linearRing,
} as const;

/** JSON Schema draft-07. Ajvでコンパイルし、全階層を検証します。 */
export const STORAGE_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "47maps Storage Export Data",
  type: "object",
  additionalProperties: false,
  required: ["version", "exportedAt", "marketareaItems", "choroplethSettings"],
  properties: {
    version: { const: STORAGE_SCHEMA_VERSION },
    exportedAt: { type: "string", format: "date-time", maxLength: 64 },
    marketareaItems: {
      type: "array",
      maxItems: ABSOLUTE_MAX_MARKETAREA_ITEMS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "name", "center", "settings", "checked"],
        properties: {
          id: shortString,
          type: { enum: ["trading", "isochrone"] },
          name: shortString,
          center: {
            type: "object",
            additionalProperties: false,
            required: ["lng", "lat"],
            properties: {
              lng: { type: "number", minimum: -180, maximum: 180 },
              lat: { type: "number", minimum: -90, maximum: 90 },
            },
          },
          settings: { type: "object" },
          checked: { type: "boolean" },
          geometry: {
            oneOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["type", "coordinates"],
                properties: {
                  type: { const: "Polygon" },
                  coordinates: polygonCoordinates,
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: ["type", "coordinates"],
                properties: {
                  type: { const: "MultiPolygon" },
                  coordinates: {
                    type: "array",
                    minItems: 1,
                    maxItems: 100,
                    items: polygonCoordinates,
                  },
                },
              },
            ],
          },
        },
        allOf: [
          {
            if: { properties: { type: { const: "trading" } } },
            then: {
              properties: {
                settings: {
                  type: "object",
                  additionalProperties: false,
                  required: ["radius", "color"],
                  properties: {
                    radius: { type: "number", minimum: 100, maximum: 8000 },
                    color,
                  },
                },
              },
            },
            else: {
              properties: {
                settings: {
                  type: "object",
                  additionalProperties: false,
                  required: ["travelMode", "contourType", "range", "color"],
                  properties: {
                    travelMode: { enum: ["walking", "cycling", "driving"] },
                    contourType: { enum: ["minutes", "meters"] },
                    range: { type: "number", minimum: 1, maximum: 8000 },
                    color,
                  },
                  allOf: [
                    {
                      if: { properties: { contourType: { const: "minutes" } } },
                      then: { properties: { range: { maximum: 60 } } },
                      else: { properties: { range: { minimum: 100 } } },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    choroplethSettings: {
      type: "object",
      additionalProperties: false,
      required: [
        "database",
        "version",
        "store",
        "column",
        "columnPath",
        "area",
      ],
      properties: {
        database: shortString,
        version: { type: "string", maxLength: 256 },
        store: shortString,
        column: {
          type: "array",
          maxItems: MAX_COLUMN_ITEMS,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "kind",
              "name",
              "desc",
              "unit",
              "dataType",
              "length",
              "scale",
              "column",
              "date1",
              "date2",
            ],
            properties: {
              kind: shortString,
              name: shortString,
              desc: { type: "string", maxLength: 2048 },
              unit: { type: "string", maxLength: 256 },
              dataType: { type: "number" },
              length: { type: "number", minimum: 0 },
              scale: { type: "number" },
              column: shortString,
              date1: { type: "number" },
              date2: { type: "number" },
            },
          },
        },
        columnPath: {
          type: "array",
          maxItems: MAX_COLUMN_PATH_ITEMS,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["class", "name"],
            properties: { class: shortString, name: shortString },
          },
        },
        area: {
          type: "array",
          maxItems: MAX_AREA_ITEMS,
          uniqueItems: true,
          items: shortString,
        },
        maxSelection: { type: "number", minimum: 0, maximum: MAX_AREA_ITEMS },
        legendSchemeType: { enum: ["sequential", "diverging", "qualitative"] },
        legendRampName: shortString,
        legendNumClasses: {
          type: "number",
          minimum: 3,
          maximum: MAX_LEGEND_ITEMS,
        },
        legendData: {
          type: "array",
          maxItems: MAX_LEGEND_ITEMS,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["color", "min", "max", "count"],
            properties: {
              color,
              min: { type: "number" },
              max: { type: "number" },
              count: { type: "number", minimum: 0 },
            },
          },
        },
      },
    },
  },
} as const;
