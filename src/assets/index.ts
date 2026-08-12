import tradingAreaMenuJson from "./tradingarea-menu.json";
import mapTypeMenuJson from "./maptype-menu.json";

export type TradingItem = {
  name: string;
  description?: string;
  icon?: string;
  meterRadius?: number;
  minutesRadius?: number[];
  [k: string]: unknown;
};

export type MapTypeItem = {
  name: string;
  description?: string;
  icon?: string;
  mapType?: string;
  database?: string;
  [k: string]: unknown;
};

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID || "47MAPS";

export const tradingAreaMenu: TradingItem[] =
  tradingAreaMenuJson as TradingItem[];
export const mapTypeMenu: MapTypeItem[] = (
  mapTypeMenuJson as MapTypeItem[]
).map((item) => ({
  ...item,
  database: DATABASE_ID,
}));

export default {
  tradingAreaMenu,
  mapTypeMenu,
};
