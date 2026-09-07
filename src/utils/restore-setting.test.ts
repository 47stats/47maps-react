import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isRestoreOnStartupEnabled,
  setRestoreOnStartupEnabled,
} from "./restore-setting";

describe("restore-on-startup setting", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
    vi.stubGlobal("localStorage", { getItem, setItem });
  });

  it("loads the preference from the user-scoped key", () => {
    getItem.mockReturnValue("false");

    expect(isRestoreOnStartupEnabled("user/id")).toBe(false);
    expect(getItem).toHaveBeenCalledWith("restore-on-startup:user%2Fid");
  });

  it("defaults to enabled when the user has no preference", () => {
    getItem.mockReturnValue(null);

    expect(isRestoreOnStartupEnabled("user/id")).toBe(true);
  });

  it("saves the preference to the user-scoped key", () => {
    setRestoreOnStartupEnabled(false, "user/id");

    expect(setItem).toHaveBeenCalledWith(
      "restore-on-startup:user%2Fid",
      "false",
    );
  });
});
