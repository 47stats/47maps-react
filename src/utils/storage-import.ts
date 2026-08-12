import Ajv from "ajv";
import {
  DEFAULT_MAX_MARKETAREA_ITEMS,
  MAX_IMPORT_FILE_SIZE_BYTES,
  STORAGE_JSON_SCHEMA,
  StorageExportData,
} from "./storage-schema";

const MARKETAREA_STORAGE_KEY = "marketarea-items";
const CHOROPLETH_STORAGE_KEY = "choropleth-settings";

export interface StorageImportLimits {
  maxFileSizeBytes?: number;
  maxMarketareaItems?: number;
}

const ajv = new Ajv({ allErrors: true, jsonPointers: true });
const validateSchema = ajv.compile(STORAGE_JSON_SCHEMA);

/** アップロードされたデータをJSON Schemaとアプリ固有制約で検証します。 */
export const validateStorageData = (
  data: unknown,
  limits: StorageImportLimits = {},
): data is StorageExportData => {
  if (!validateSchema(data)) {
    return false;
  }

  const validated = data as StorageExportData;
  const maxMarketareaItems =
    limits.maxMarketareaItems ?? DEFAULT_MAX_MARKETAREA_ITEMS;

  if (
    !Number.isInteger(maxMarketareaItems) ||
    maxMarketareaItems < 0 ||
    validated.marketareaItems.length > maxMarketareaItems
  ) {
    return false;
  }

  // JSON SchemaのuniqueItemsではオブジェクト内のID重複までは表現できない。
  const ids = new Set(validated.marketareaItems.map((item) => item.id));
  return ids.size === validated.marketareaItems.length;
};

/** JSONファイルを読み込んでLocalStorageにインポートします。 */
export const importStorageFromJson = async (
  file: File,
  limits: StorageImportLimits = {},
): Promise<{ success: boolean; error?: string }> => {
  const maxFileSizeBytes =
    limits.maxFileSizeBytes ?? MAX_IMPORT_FILE_SIZE_BYTES;
  const maxMarketareaItems =
    limits.maxMarketareaItems ?? DEFAULT_MAX_MARKETAREA_ITEMS;

  if (file.size > maxFileSizeBytes) {
    return {
      success: false,
      error: `ファイルサイズが上限（${Math.floor(maxFileSizeBytes / 1024)}KB）を超えています。`,
    };
  }

  try {
    const text = await file.text();
    const data: unknown = JSON.parse(text);

    if (!validateStorageData(data, { maxMarketareaItems })) {
      return {
        success: false,
        error:
          "無効なファイル形式または上限を超えるデータです。正しい47mapsのエクスポートファイルを選択してください。",
      };
    }

    localStorage.setItem(
      MARKETAREA_STORAGE_KEY,
      JSON.stringify(data.marketareaItems),
    );
    localStorage.setItem(
      CHOROPLETH_STORAGE_KEY,
      JSON.stringify(data.choroplethSettings),
    );

    return { success: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error:
          "JSONファイルの解析に失敗しました。ファイルが破損している可能性があります。",
      };
    }
    return {
      success: false,
      error: `ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
