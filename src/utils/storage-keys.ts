export const MARKETAREA_STORAGE_KEY = "marketarea-items";
export const CHOROPLETH_STORAGE_KEY = "choropleth-settings";
export const RESTORE_ON_STARTUP_STORAGE_KEY = "restore-on-startup";

const getScopedStorageKey = (
  storageKey: string,
  storageScope?: string,
): string => {
  const normalizedScope = storageScope?.trim();

  return normalizedScope
    ? `${storageKey}:${encodeURIComponent(normalizedScope)}`
    : storageKey;
};

/**
 * Returns the market area items key for a storage scope.
 * Omitting the scope preserves the library's standalone behavior.
 */
export const getMarketareaStorageKey = (storageScope?: string): string =>
  getScopedStorageKey(MARKETAREA_STORAGE_KEY, storageScope);

/**
 * Returns the choropleth settings key for a storage scope.
 * Omitting the scope preserves the library's standalone behavior.
 */
export const getChoroplethStorageKey = (storageScope?: string): string =>
  getScopedStorageKey(CHOROPLETH_STORAGE_KEY, storageScope);

/**
 * Returns the restore-on-startup preference key for a storage scope.
 * Omitting the scope preserves the library's standalone behavior.
 */
export const getRestoreOnStartupStorageKey = (storageScope?: string): string =>
  getScopedStorageKey(RESTORE_ON_STARTUP_STORAGE_KEY, storageScope);
