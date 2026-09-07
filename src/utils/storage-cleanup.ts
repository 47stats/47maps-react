import {
  getChoroplethStorageKey,
  getMarketareaStorageKey,
  getRestoreOnStartupStorageKey,
} from "./storage-keys";

/** Removes map data belonging to one storage scope without touching shared data. */
export const removeMapStorageData = (storageScope: string): void => {
  if (!storageScope.trim()) {
    return;
  }

  const storageKeys = [
    getMarketareaStorageKey(storageScope),
    getChoroplethStorageKey(storageScope),
    getRestoreOnStartupStorageKey(storageScope),
  ];

  for (const storageKey of storageKeys) {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove ${storageKey} from localStorage:`, error);
    }
  }
};
