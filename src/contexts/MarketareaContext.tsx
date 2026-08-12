import { createContext } from "react";
import type { Polygon, MultiPolygon } from "geojson";

// 円商圏の設定
export interface TradingAreaSettings {
  radius: number; // メートルまたは分数
  color: string;
}

// 到達圏の設定
export interface IsochroneSettings {
  travelMode: "walking" | "cycling" | "driving";
  contourType: "minutes" | "meters";
  range: number;
  ranges: {
    minutes: number;
    meters: number;
  };
  color: string;
}

// 登録された商圏アイテム
export interface MarketareaItem {
  id: string;
  type: "trading" | "isochrone";
  name: string;
  center: { lng: number; lat: number };
  settings: TradingAreaSettings | IsochroneSettings;
  checked: boolean;
  geometry?: Polygon | MultiPolygon;
}

interface MarketareaContextType {
  // 円商圏設定
  tradingSettings: TradingAreaSettings;
  setTradingSettings: (settings: TradingAreaSettings) => void;

  // 到達圏設定
  isochroneSettings: IsochroneSettings;
  setIsochroneSettings: (settings: IsochroneSettings) => void;

  // 登録されたアイテムリスト
  items: MarketareaItem[];
  addItem: (item: MarketareaItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  updateItemCenter: (id: string, center: { lng: number; lat: number }) => void;
  updateItemGeometry: (id: string, geometry: Polygon | MultiPolygon) => void;
}

export const MarketareaContext = createContext<MarketareaContextType>({
  tradingSettings: { radius: 500, color: "#ff0000" },
  setTradingSettings: () => {},
  isochroneSettings: {
    travelMode: "walking",
    contourType: "minutes",
    range: 10,
    ranges: { minutes: 10, meters: 100 },
    color: "#0000ff",
  },
  setIsochroneSettings: () => {},
  items: [],
  addItem: () => {},
  removeItem: () => {},
  toggleItem: () => {},
  updateItemCenter: () => {},
  updateItemGeometry: () => {},
});
