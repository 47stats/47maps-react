import { beforeEach, describe, expect, it, vi } from "vitest";
import { importStorageFromJson, validateStorageData } from "./storage-import";
import {
  MAX_IMPORT_FILE_SIZE_BYTES,
  StorageExportData,
} from "./storage-schema";

const createValidData = (): StorageExportData => ({
  version: "1.0.0",
  exportedAt: "2026-08-03T00:00:00.000Z",
  marketareaItems: [
    {
      id: "area-1",
      type: "trading",
      name: "円商圏 500m",
      center: { lng: 139.767, lat: 35.681 },
      settings: { radius: 500, color: "#ff0000" },
      checked: true,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [139.76, 35.68],
            [139.77, 35.68],
            [139.77, 35.69],
            [139.76, 35.68],
          ],
        ],
      },
    },
  ],
  choroplethSettings: {
    database: "sample",
    version: "",
    store: "PREF",
    column: [
      {
        kind: "population",
        name: "人口",
        desc: "総人口",
        unit: "人",
        dataType: 1,
        length: 10,
        scale: 0,
        column: "population_total",
        date1: 2020,
        date2: 2020,
      },
    ],
    columnPath: [{ class: "population", name: "人口" }],
    area: ["13"],
    maxSelection: 100,
    legendSchemeType: "sequential",
    legendRampName: "YlOrRd",
    legendNumClasses: 3,
    legendData: [
      { color: "#ffffcc", min: 0, max: 100, count: 1 },
      { color: "#fd8d3c", min: 100, max: 200, count: 1 },
      { color: "#800026", min: 200, max: 300, count: 1 },
    ],
  },
});

describe("validateStorageData", () => {
  it("正しいエクスポートデータを受理する", () => {
    expect(validateStorageData(createValidData())).toBe(true);
  });

  it("設定された商圏件数の上限を適用する", () => {
    const data = createValidData();
    data.marketareaItems.push({
      ...data.marketareaItems[0],
      id: "area-2",
    });

    expect(validateStorageData(data, { maxMarketareaItems: 1 })).toBe(false);
  });

  it("商圏IDの重複を拒否する", () => {
    const data = createValidData();
    data.marketareaItems.push({ ...data.marketareaItems[0] });

    expect(validateStorageData(data)).toBe(false);
  });

  it("範囲外の緯度を拒否する", () => {
    const data = createValidData();
    data.marketareaItems[0].center.lat = 91;

    expect(validateStorageData(data)).toBe(false);
  });

  it("商圏種別と一致しない設定を拒否する", () => {
    const data = createValidData();
    data.marketareaItems[0] = {
      ...data.marketareaItems[0],
      settings: {
        travelMode: "walking",
        contourType: "minutes",
        range: 10,
        color: "#ff0000",
      },
    };

    expect(validateStorageData(data)).toBe(false);
  });

  it("未定義のプロパティを拒否する", () => {
    const data = createValidData() as StorageExportData & {
      unexpected?: string;
    };
    data.unexpected = "value";

    expect(validateStorageData(data)).toBe(false);
  });
});

describe("importStorageFromJson", () => {
  const setItem = vi.fn();

  beforeEach(() => {
    setItem.mockClear();
    vi.stubGlobal("localStorage", { setItem });
  });

  it("ファイルサイズ上限を超えた場合は本文を読み込まない", async () => {
    const text = vi.fn();
    const file = {
      size: MAX_IMPORT_FILE_SIZE_BYTES + 1,
      text,
    } as unknown as File;

    const result = await importStorageFromJson(file);

    expect(result.success).toBe(false);
    expect(text).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("検証成功後にのみ2つの保存領域へ書き込む", async () => {
    const data = createValidData();
    const body = JSON.stringify(data);
    const file = {
      size: new TextEncoder().encode(body).byteLength,
      text: vi.fn().mockResolvedValue(body),
    } as unknown as File;

    const result = await importStorageFromJson(file);

    expect(result).toEqual({ success: true });
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem).toHaveBeenNthCalledWith(
      1,
      "marketarea-items",
      JSON.stringify(data.marketareaItems),
    );
    expect(setItem).toHaveBeenNthCalledWith(
      2,
      "choropleth-settings",
      JSON.stringify(data.choroplethSettings),
    );
  });
});
