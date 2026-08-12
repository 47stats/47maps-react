import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { AppConfig, getConfig } from "../config";
import { APIEnv } from "@47stats/api";

interface ConfigContextType {
  config: AppConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  userConfig?: Partial<AppConfig>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  userConfig,
}) => {
  const config = useMemo(() => {
    const c = getConfig(userConfig);
    if (!c.statsApiUrl || !c.statsApiKey) {
      throw new Error(
        "47maps-react: statsApiUrl と statsApiKey が未設定です。" +
          "ConfigProvider の userConfig で指定してください。",
      );
    }
    // 子コンポーネントの effect(API呼び出し)より先に設定されている必要があるため、
    // effect ではなくレンダー段階で代入する(同値の再代入で冪等のため StrictMode でも安全)
    APIEnv.API_URL = c.statsApiUrl;
    APIEnv.API_KEY = c.statsApiKey;
    return c;
  }, [userConfig]);

  return (
    <ConfigContext.Provider value={{ config }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): AppConfig => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context.config;
};
