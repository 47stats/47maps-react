import { useState, ReactNode, useEffect } from "react";
import {
  MarketareaContext,
  TradingAreaSettings,
  IsochroneSettings,
  MarketareaItem,
} from "./MarketareaContext";
import { isRestoreOnStartupEnabled } from "../utils";

interface MarketareaProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "marketarea-items";

export const MarketareaProvider = ({ children }: MarketareaProviderProps) => {
  const [tradingSettings, setTradingSettings] = useState<TradingAreaSettings>({
    radius: 500,
    color: "#ff0000",
  });

  const [isochroneSettings, setIsochroneSettings] = useState<IsochroneSettings>(
    {
      travelMode: "walking",
      contourType: "minutes",
      range: 10,
      ranges: { minutes: 10, meters: 100 },
      color: "#0000ff",
    },
  );

  // localStorageから初期データを読み込み
  const [items, setItems] = useState<MarketareaItem[]>(() => {
    try {
      const stored = isRestoreOnStartupEnabled()
        ? localStorage.getItem(STORAGE_KEY)
        : null;
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(
        "Failed to load marketarea items from localStorage:",
        error,
      );
    }
    return [];
  });

  const addItem = (item: MarketareaItem) => {
    setItems((prev) => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const updateItemCenter = (
    id: string,
    center: { lng: number; lat: number },
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, center } : item)),
    );
  };

  const updateItemGeometry = (
    id: string,
    geometry: NonNullable<MarketareaItem["geometry"]>,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, geometry } : item)),
    );
  };

  // itemsが変更されたらlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save marketarea items to localStorage:", error);
    }
  }, [items]);

  return (
    <MarketareaContext.Provider
      value={{
        tradingSettings,
        setTradingSettings,
        isochroneSettings,
        setIsochroneSettings,
        items,
        addItem,
        removeItem,
        toggleItem,
        updateItemCenter,
        updateItemGeometry,
      }}
    >
      {children}
    </MarketareaContext.Provider>
  );
};
