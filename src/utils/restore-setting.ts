const RESTORE_ON_STARTUP_KEY = "restore-on-startup";

// 未設定の場合は復元する（デフォルトON）
export function isRestoreOnStartupEnabled(): boolean {
  try {
    return localStorage.getItem(RESTORE_ON_STARTUP_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setRestoreOnStartupEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(RESTORE_ON_STARTUP_KEY, String(enabled));
  } catch (error) {
    console.error("Failed to save restore-on-startup setting:", error);
  }
}
