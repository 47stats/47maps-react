export interface AppConfig {
  mapboxAccessToken: string;
  statsApiUrl: string;
  statsApiKey: string;
  helpUrl: string;
  statsApiMaxRows: number;
  statsApiMaxCols: number;
  classId: string;
  schemeType: string;
  rampName: string;
  numClasses: number;
  extrudeHeightScale: number; // 立体の高さスケール
  marketareaMaxItems: number; // 商圏の最大登録数
}

export const defaultConfig: AppConfig = {
  mapboxAccessToken: "",
  statsApiUrl: "",
  statsApiKey: "",
  helpUrl: "/help/index.html",
  statsApiMaxRows: 1000,
  statsApiMaxCols: 300,
  classId: "KOK@",
  schemeType: "sequential",
  rampName: "YlOrRd",
  numClasses: 7,
  extrudeHeightScale: 5000,
  marketareaMaxItems: 20,
};

export const getConfig = (userConfig?: Partial<AppConfig>): AppConfig => {
  // 環境変数はここでは読まない。ライブラリコードで import.meta.env を参照すると
  // ライブラリビルド時に .env の実値がバンドルへ焼き込まれるため、
  // 環境変数の読み取りはアプリのエントリ(main.tsx)でのみ行い userConfig で渡す。
  const overrides = Object.fromEntries(
    Object.entries(userConfig ?? {}).filter(([, value]) => value !== undefined),
  ) as Partial<AppConfig>;

  return {
    ...defaultConfig,
    ...overrides,
  };
};

// 設定の型チェック用ヘルパー
export const validateConfig = (config: AppConfig): boolean => {
  return (
    typeof config.numClasses === "number" &&
    config.numClasses > 0 &&
    typeof config.schemeType === "string" &&
    typeof config.rampName === "string"
  );
};
