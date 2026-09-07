import { describe, expect, it } from "vitest";
import {
  getChoroplethStorageKey,
  getMarketareaStorageKey,
  getRestoreOnStartupStorageKey,
} from "./storage-keys";

describe("getMarketareaStorageKey", () => {
  it("returns the shared key when no scope is provided", () => {
    expect(getMarketareaStorageKey()).toBe("marketarea-items");
  });

  it("returns an encoded user-scoped key", () => {
    expect(getMarketareaStorageKey(" user/id ")).toBe(
      "marketarea-items:user%2Fid",
    );
  });
});

describe("getChoroplethStorageKey", () => {
  it("returns the shared key when no scope is provided", () => {
    expect(getChoroplethStorageKey()).toBe("choropleth-settings");
  });

  it("returns an encoded user-scoped key", () => {
    expect(getChoroplethStorageKey(" user/id ")).toBe(
      "choropleth-settings:user%2Fid",
    );
  });
});

describe("getRestoreOnStartupStorageKey", () => {
  it("returns the shared key when no scope is provided", () => {
    expect(getRestoreOnStartupStorageKey()).toBe("restore-on-startup");
  });

  it("returns an encoded user-scoped key", () => {
    expect(getRestoreOnStartupStorageKey(" user/id ")).toBe(
      "restore-on-startup:user%2Fid",
    );
  });
});
