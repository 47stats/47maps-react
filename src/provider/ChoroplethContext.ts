import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ColumnInfoType, JsonObject } from "@47stats/api";

export interface ColumnPathItem {
  class: string;
  name: string;
}

export interface LegendDataItem {
  color: string;
  min: number;
  max: number;
  count: number;
}

export interface ChoroplethContextData {
  storageScope?: string;
  database: string;
  version: string;
  store: string;

  column: ColumnInfoType[];
  columnPath: ColumnPathItem[];
  area: string[];
  isMapClickSelection: boolean;
  popupInfo: JsonObject;
  isMarketareaDrawerActive: boolean;
  maxSelection: number;
  errorMessage: string | null;
  filterPolygon: string | undefined;

  legendSchemeType: string;
  legendRampName: string;
  legendNumClasses: number;
  legendData: LegendDataItem[];

  setDatabase: Dispatch<SetStateAction<string>>;
  setVersion: Dispatch<SetStateAction<string>>;
  setStore: Dispatch<SetStateAction<string>>;
  setColumn: Dispatch<SetStateAction<ColumnInfoType[]>>;
  setColumnPath: Dispatch<SetStateAction<ColumnPathItem[]>>;
  setArea: Dispatch<SetStateAction<string[]>>;
  setIsMapClickSelection: Dispatch<SetStateAction<boolean>>;
  setPopupInfo: Dispatch<SetStateAction<JsonObject>>;
  setIsMarketareaDrawerActive: Dispatch<SetStateAction<boolean>>;
  setMaxSelection: Dispatch<SetStateAction<number>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setFilterPolygon: Dispatch<SetStateAction<string | undefined>>;
  setLegendSchemeType: Dispatch<SetStateAction<string>>;
  setLegendRampName: Dispatch<SetStateAction<string>>;
  setLegendNumClasses: Dispatch<SetStateAction<number>>;
  setLegendData: Dispatch<SetStateAction<LegendDataItem[]>>;
}

export const ChoroplethContext = createContext<ChoroplethContextData>(
  {} as ChoroplethContextData,
);
