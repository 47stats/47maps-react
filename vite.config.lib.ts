import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const runtimeDependencies = [
  "@47stats/api",
  "@mapbox/mapbox-gl-geocoder",
  "@mapbox/mapbox-gl-language",
  "@turf/turf",
  "ajv",
  "flowbite-react",
  "mapbox-gl",
  "react",
  "react-colorful",
  "react-dom",
  "react-icons",
  "react-map-gl",
  "recharts",
];

const isRuntimeDependency = (id: string) =>
  runtimeDependencies.some(
    (dependency) => id === dependency || id.startsWith(`${dependency}/`),
  );

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "47MapsReact",
      cssFileName: "style",
      fileName: () => `index.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: isRuntimeDependency,
      output: {
        preserveModules: false,
      },
    },
    sourcemap: false,
    emptyOutDir: false, // 型定義ファイルを削除しないように変更
  },
});
