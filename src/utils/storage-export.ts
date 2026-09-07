import { StorageExportData } from "./storage-schema";
import {
  getChoroplethStorageKey,
  getMarketareaStorageKey,
} from "./storage-keys";

/**
 * LocalStorageからデータを取得してエクスポート用のオブジェクトを生成
 */
export const getStorageExportData = (
  storageScope?: string,
): StorageExportData => {
  const marketareaItems = localStorage.getItem(
    getMarketareaStorageKey(storageScope),
  );
  const choroplethSettings = localStorage.getItem(
    getChoroplethStorageKey(storageScope),
  );

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    marketareaItems: marketareaItems ? JSON.parse(marketareaItems) : [],
    choroplethSettings: choroplethSettings
      ? JSON.parse(choroplethSettings)
      : {},
  };
};

/**
 * 現在の日付を yyyymmdd 形式で取得
 */
const getDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

/**
 * データをJSONファイルとしてダウンロード
 */
export const downloadStorageAsJson = (storageScope?: string): void => {
  const data = getStorageExportData(storageScope);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const filename = `47maps-${getDateString()}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // クリーンアップ
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
