import { useState, ReactNode, useEffect } from "react";
import {
  MarketareaContext,
  TradingAreaSettings,
  IsochroneSettings,
  MarketareaItem,
} from "./MarketareaContext";
import { isRestoreOnStartupEnabled } from "../utils";
import { getMarketareaStorageKey } from "../utils/storage-keys";

interface MarketareaProviderProps {
  children: ReactNode;
  /**
   * Isolates persisted items between consumers, such as authenticated users.
   * Use a stable, non-personal identifier rather than an email address.
   */
  storageScope?: string;
}

export const MarketareaProvider = ({
  children,
  storageScope,
}: MarketareaProviderProps) => {
  const storageKey = getMarketareaStorageKey(storageScope);

  return (
    <ScopedMarketareaProvider
      key={storageKey}
      storageKey={storageKey}
      storageScope={storageScope}
    >
      {children}
    </ScopedMarketareaProvider>
  );
};

interface ScopedMarketareaProviderProps {
  children: ReactNode;
  storageKey: string;
  storageScope?: string;
}

const ScopedMarketareaProvider = ({
  children,
  storageKey,
  storageScope,
}: ScopedMarketareaProviderProps) => {
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
      const stored = isRestoreOnStartupEnabled(storageScope)
        ? localStorage.getItem(storageKey)
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
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save marketarea items to localStorage:", error);
    }
  }, [items, storageKey]);

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
