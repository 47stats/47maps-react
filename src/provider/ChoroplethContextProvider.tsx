import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { ColumnInfoType, JsonObject } from "@47stats/api";
import { isRestoreOnStartupEnabled } from "../utils";
import { getChoroplethStorageKey } from "../utils/storage-keys";
import {
  ChoroplethContext,
  ColumnPathItem,
  LegendDataItem,
} from "./ChoroplethContext";

interface ChoroplethStorageData {
  database: string;
  version: string;
  store: string;
  column: ColumnInfoType[];
  columnPath: ColumnPathItem[]; // 統計選択のパス
  area: string[];
  maxSelection?: number;
  // 凡例設定
  legendSchemeType?: string;
  legendRampName?: string;
  legendNumClasses?: number;
  legendData?: LegendDataItem[]; // 凡例の色と値
}

/**
 * localStorageから保存済み設定を読み込みます。
 * 復元が無効・未保存・パース失敗の場合は空オブジェクトを返します。
 */
function loadStoredSettings(
  storageKey: string,
  storageScope?: string,
): Partial<ChoroplethStorageData> {
  try {
    const stored = isRestoreOnStartupEnabled(storageScope)
      ? localStorage.getItem(storageKey)
      : null;
    if (stored) {
      return JSON.parse(stored) as ChoroplethStorageData;
    }
  } catch (error) {
    console.error(
      "Failed to load choropleth settings from localStorage:",
      error,
    );
  }
  return {};
}

type ChoroplethContextProviderProps = PropsWithChildren<{
  /**
   * Isolates persisted settings between consumers, such as authenticated users.
   * Use a stable, non-personal identifier rather than an email address.
   */
  storageScope?: string;
}>;

export function ChoroplethContextProvider({
  children,
  storageScope,
}: ChoroplethContextProviderProps) {
  const storageKey = getChoroplethStorageKey(storageScope);

  return (
    <ScopedChoroplethContextProvider
      key={storageKey}
      storageKey={storageKey}
      storageScope={storageScope}
    >
      {children}
    </ScopedChoroplethContextProvider>
  );
}

type ScopedChoroplethContextProviderProps = PropsWithChildren<{
  storageKey: string;
  storageScope?: string;
}>;

function ScopedChoroplethContextProvider({
  children,
  storageKey,
  storageScope,
}: ScopedChoroplethContextProviderProps) {
  // localStorageからの読み込みはマウント時に1回だけ行い、各stateに分配する
  const [initial] = useState(() =>
    loadStoredSettings(storageKey, storageScope),
  );

  const [database, setDatabase] = useState<string>(initial.database || "");
  const [version, setVersion] = useState<string>(initial.version || "");
  const [store, setStore] = useState<string>(initial.store || "");
  const [column, setColumn] = useState<ColumnInfoType[]>(initial.column || []);
  const [columnPath, setColumnPath] = useState<ColumnPathItem[]>(
    initial.columnPath || [],
  );
  const [area, setArea] = useState<string[]>(initial.area || []);

  // 凡例設定
  const [legendSchemeType, setLegendSchemeType] = useState<string>(
    initial.legendSchemeType || "",
  );
  const [legendRampName, setLegendRampName] = useState<string>(
    initial.legendRampName || "",
  );
  const [legendNumClasses, setLegendNumClasses] = useState<number>(
    initial.legendNumClasses || 0,
  );
  const [legendData, setLegendData] = useState<LegendDataItem[]>(
    initial.legendData || [],
  );

  const [isMapClickSelection, setIsMapClickSelection] =
    useState<boolean>(false);
  const [popupInfo, setPopupInfo] = useState<JsonObject>({});
  const [isMarketareaDrawerActive, setIsMarketareaDrawerActive] =
    useState<boolean>(false);
  const [filterPolygon, setFilterPolygon] = useState<string | undefined>(
    undefined,
  );
  const [maxSelection, setMaxSelection] = useState<number>(
    initial.maxSelection || 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 前回のstoreとcolumnIdを追跡
  const prevStoreRef = useRef<string>(store);
  const prevColumnIdRef = useRef<string | undefined>(column[0]?.column);

  // 復元直後はクリック選択モードではないため、初回レンダー後に明示的にリセット
  useEffect(() => {
    setIsMapClickSelection(false);
    // この効果は初回のみ実行（依存なし）
  }, []);

  // storeまたはcolumnが変更されたらpopupInfoをクリア
  useEffect(() => {
    const currentColumnId = column[0]?.column;
    if (
      prevStoreRef.current !== store ||
      prevColumnIdRef.current !== currentColumnId
    ) {
      setPopupInfo({});
      prevStoreRef.current = store;
      prevColumnIdRef.current = currentColumnId;
    }
  }, [store, column]);

  // 設定が変更されたらlocalStorageに保存
  useEffect(() => {
    try {
      const data: ChoroplethStorageData = {
        database,
        version,
        store,
        column,
        columnPath,
        area,
        maxSelection: maxSelection || undefined,
        legendSchemeType: legendSchemeType || undefined,
        legendRampName: legendRampName || undefined,
        legendNumClasses: legendNumClasses || undefined,
        legendData: legendData.length > 0 ? legendData : undefined,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(
        "Failed to save choropleth settings to localStorage:",
        error,
      );
    }
  }, [
    database,
    version,
    store,
    column,
    columnPath,
    area,
    maxSelection,
    legendSchemeType,
    legendRampName,
    legendNumClasses,
    legendData,
    storageKey,
  ]);

  return (
    <ChoroplethContext.Provider
      value={{
        storageScope,
        database,
        setDatabase,
        version,
        setVersion,
        store,
        setStore,
        column,
        setColumn,
        columnPath,
        setColumnPath,
        area,
        setArea,
        isMapClickSelection,
        setIsMapClickSelection,
        popupInfo,
        setPopupInfo,
        isMarketareaDrawerActive,
        setIsMarketareaDrawerActive,
        maxSelection,
        setMaxSelection,
        errorMessage,
        setErrorMessage,
        filterPolygon,
        setFilterPolygon,
        legendSchemeType,
        setLegendSchemeType,
        legendRampName,
        setLegendRampName,
        legendNumClasses,
        setLegendNumClasses,
        legendData,
        setLegendData,
      }}
    >
      {children}
    </ChoroplethContext.Provider>
  );
}
