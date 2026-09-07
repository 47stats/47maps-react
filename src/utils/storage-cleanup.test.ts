import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeMapStorageData } from "./storage-cleanup";

describe("removeMapStorageData", () => {
  const removeItem = vi.fn();

  beforeEach(() => {
    removeItem.mockClear();
    vi.stubGlobal("localStorage", { removeItem });
  });

  it("removes both kinds of data for the given user", () => {
    removeMapStorageData("user/id");

    expect(removeItem).toHaveBeenCalledTimes(3);
    expect(removeItem).toHaveBeenNthCalledWith(1, "marketarea-items:user%2Fid");
    expect(removeItem).toHaveBeenNthCalledWith(
      2,
      "choropleth-settings:user%2Fid",
    );
    expect(removeItem).toHaveBeenNthCalledWith(
      3,
      "restore-on-startup:user%2Fid",
    );
  });

  it("does not remove shared data when the scope is empty", () => {
    removeMapStorageData(" ");

    expect(removeItem).not.toHaveBeenCalled();
  });
});
