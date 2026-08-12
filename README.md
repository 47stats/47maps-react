# @47stats/47maps-react

47stats API と Mapbox GL JS を組み合わせた人口統計地図アプリを、React コンポーネントとして組み込めるライブラリです。

階級区分図（コロプレスマップ）による統計可視化、商圏・到達圏の描画、住所検索、3D 建物表示などをすぐに利用できます。

## 特徴

- 47stats API と連携した階級区分図（コロプレスマップ）
- ColorBrewer カラースキームによる凡例の編集
- 商圏分析（半径指定・等時圏）
- Mapbox Geocoding API による住所検索
- 地図スタイル切り替え / 2D-3D 切り替え / 3D 建物表示
- 地図状態の localStorage 永続化・インポート/エクスポート
- React 18 / 19 対応
- TypeScript 対応
- ESM 配布
- Flowbite React ベースの UI・ダークモード対応

## インストール

```bash
npm install @47stats/47maps-react @47stats/api
```

## Peer Dependencies

- `react >= 18.0.0 < 20.0.0`
- `react-dom >= 18.0.0 < 20.0.0`
- `@47stats/api >= 0.9.0 < 0.10.0`

## クイックスタート

### 1. 環境変数を設定する

`.env.example` をコピーし、本番用の `.env.production` とローカル開発用の
`.env.development.local` にMapboxアクセストークンと47stats API設定を定義します。

```bash
cp .env.example .env.production
cp .env.example .env.development.local
```

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
VITE_STATS_API_URL=https://your-api.example.com
VITE_STATS_API_KEY=your-api-key
```

Mapbox アクセストークンは [Mapbox アカウント](https://account.mapbox.com/access-tokens/) から取得できます。
`npm run dev` は `.env.development.local`、`npm run build` は `.env.production` を使用します。
MapboxのURL制限に合わせ、開発用と本番用で異なる公開トークンを設定してください。

`VITE_` で始まる値はビルド後のJavaScriptとブラウザの通信内容から確認できます。
Mapboxトークンと47stats APIキーはいずれも公開クライアント用として扱い、秘密情報を設定しないでください。
本番環境ではURL/リファラー制限、レート制限、利用量上限、監視、定期ローテーションを併用してください。

### 2. スタイルをインポートする

```tsx
import "@47stats/47maps-react/style.css";
```

### 3. プロバイダーと地図コンポーネントを組み合わせる

```js
import {
  ConfigProvider,
  MapWrapper,
  ChoroplethContextProvider,
  Map,
} from "@47stats/47maps-react";
import "@47stats/47maps-react/style.css";

export default function App() {
  return (
    <ConfigProvider
      userConfig={{
        mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
        statsApiUrl: import.meta.env.VITE_STATS_API_URL,
        statsApiKey: import.meta.env.VITE_STATS_API_KEY,
      }}
    >
      <MapWrapper>
        <ChoroplethContextProvider>
          <Map />
        </ChoroplethContextProvider>
      </MapWrapper>
    </ConfigProvider>
  );
}
```

`ConfigProvider` はライブラリ利用側の環境変数を直接読み取りません。
`statsApiUrl` と `statsApiKey` は `userConfig` で必ず渡してください。

## 設定

`ConfigProvider` が受け取る `userConfig` のキー一覧です。

| キー                 | 型       | デフォルト     | 説明                       |
| -------------------- | -------- | -------------- | -------------------------- |
| `mapboxAccessToken`  | `string` | `""`           | Mapbox アクセストークン    |
| `statsApiUrl`        | `string` | `""`           | 47stats API エンドポイント |
| `statsApiKey`        | `string` | `""`           | 47stats API キー           |
| `helpUrl`            | `string` | `"/help/index.html"` | ヘルプリンク        |
| `statsApiMaxRows`    | `number` | `1000`         | 取得最大行数               |
| `statsApiMaxCols`    | `number` | `300`          | 取得最大列数               |
| `classId`            | `string` | `"KOK@"`       | デフォルト統計項目         |
| `schemeType`         | `string` | `"sequential"` | カラースキームタイプ       |
| `rampName`           | `string` | `"YlOrRd"`     | カラーランプ名             |
| `numClasses`         | `number` | `7`            | 階級数                     |
| `extrudeHeightScale` | `number` | `5000`         | 3D 押し出し高さスケール    |
| `marketareaMaxItems` | `number` | `20`           | 商圏の最大登録数           |

上記の環境変数名は利用例です。ライブラリが環境変数を直接参照することはありません。

## 主なエクスポート

### プロバイダー / コンテキスト

- `ConfigProvider` — API キー・地図設定の供給元
- `MapWrapper` — react-map-gl の `MapProvider` ラッパー
- `ChoroplethContextProvider` — 階級区分図の状態管理
- `MarketareaProvider` — 商圏・到達圏の状態管理

### 地図コンポーネント

- `Map` — メイン地図コンポーネント（階級区分図・コントロール含む）

### フック

- `useConfig()` — 現在の `AppConfig` を取得
- `useWindowSize()` — ウィンドウサイズの監視

### ユーティリティ

- `downloadStorageAsJson()` — アプリ状態を JSON でエクスポート
- `importStorageFromJson()` — JSON からアプリ状態を復元
- ColorBrewer スキーム定数

### アセット

- `tradingAreaMenu` — 商圏タイプの定義リスト
- `mapTypeMenu` — 地図タイプの定義リスト

## スタイリング

このライブラリは Flowbite React と Tailwind CSS を前提にしたコンポーネントを含みます。

Tailwind を利用するアプリでは、必要に応じて `content` にライブラリの配下を追加してください。

```js
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.js",
    "./node_modules/@47stats/47maps-react/dist/**/*.js",
  ],
  darkMode: "class",
};
```

## 開発

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build:lib
npm run build:pkg
```

### 主なスクリプト

- `npm run dev` — 開発サーバーを起動します
- `npm run build` — ヘルプドキュメントとアプリをビルドします
- `npm run build:lib` — ライブラリをビルドします
- `npm run build:pkg` — npm 配布用パッケージを作成します
- `npm run release:check` — テスト・型・lint・公開内容をまとめて確認します
- `npm run typecheck` — TypeScript 型チェックを実行します
- `npm run docs:dev` — VitePress ドキュメントの開発サーバーを起動します
- `npm run docs:build` — ヘルプドキュメントを `public/help/` に生成します

生成された `public/help/` はnpmパッケージにも同梱されます。利用するアプリは
`node_modules/@47stats/47maps-react/public/help/` を自身の公開ディレクトリの
`help/` へコピーし、`helpUrl` に `/help/index.html` を指定してください。

## npmへの公開

公開前に、バージョンとパッケージ内容を確認します。

```bash
npm ci
npm run release:check
npm publish
```

このパッケージは `publishConfig.access` に `public` を設定しています。
公開には `@47stats` scopeへの権限と、npmの2要素認証または公開用トークンが必要です。

## 制約

- ブラウザ上で動作するクライアントコンポーネントです。SSRでは地図部分をクライアント側で読み込んでください。
- 同一ページでは1組の47stats API設定を使用してください。`@47stats/api` の設定はパッケージインスタンス内で共有されます。
- 地図レンダリングにはWebGLサポートが必要です。

## Links

- 47maps: https://47maps.com/
- Repository: https://github.com/47stats/47maps-react
- @47stats/api npmパッケージ: https://www.npmjs.com/package/@47stats/api
- developers 47stats: https://developers.47stats.com/
- 47stats: https://www.47stats.com/

## コントリビューション

コントリビューションを歓迎します！プルリクエストをお気軽に送ってください。

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/AmazingFeature`）
3. 変更をコミット（`git commit -m 'Add some AmazingFeature'`）
4. ブランチにプッシュ（`git push origin feature/AmazingFeature`）
5. プルリクエストを開く

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

この製品にはCynthia Brewerが開発した色仕様およびデザインが含まれます。
第三者コンポーネントの表示は[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)を参照してください。

## 作者

**team 47stats**

---

Made with ❤️ by 47stats
