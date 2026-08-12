import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "./contexts/ConfigContext";
import { AppConfig } from "./config";
import "./index.css";

// 環境変数の読み取りはこのエントリファイルでのみ行う。
// ライブラリ側(src/index.ts 配下)で import.meta.env を参照すると、
// ライブラリビルド時に .env の実値がバンドルへ焼き込まれるため。
const env = import.meta.env;
const envConfig: Partial<AppConfig> = {
  mapboxAccessToken: env.VITE_MAPBOX_ACCESS_TOKEN,
  statsApiUrl: env.VITE_STATS_API_URL,
  statsApiKey: env.VITE_STATS_API_KEY,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider userConfig={envConfig}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
