import { getRestoreOnStartupStorageKey } from "./storage-keys";

// 未設定の場合は復元する（デフォルトON）
export function isRestoreOnStartupEnabled(storageScope?: string): boolean {
  try {
    return (
      localStorage.getItem(getRestoreOnStartupStorageKey(storageScope)) !==
      "false"
    );
  } catch {
    return true;
  }
}

export function setRestoreOnStartupEnabled(
  enabled: boolean,
  storageScope?: string,
): void {
  try {
    localStorage.setItem(
      getRestoreOnStartupStorageKey(storageScope),
      String(enabled),
    );
  } catch (error) {
    console.error("Failed to save restore-on-startup setting:", error);
  }
}
