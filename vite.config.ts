import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  if (isLib) {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, "index.ts"),
          name: "47MapsReact",
          fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
          formats: ["es"],
        },
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              "mapbox-gl": "mapboxgl",
              "react-map-gl": "ReactMapGL",
            },
          },
        },
        sourcemap: true,
        emptyOutDir: true,
      },
    };
  }

  return {
    base: "./",
    plugins: [react()],
    optimizeDeps: {
      include: ["react-map-gl/mapbox"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        reactcss: "reactcss/lib/index.js",
      },
    },
    build: {
      rollupOptions: {
        plugins: [
          visualizer({
            open: true,
            filename: "dist/stats.html",
            gzipSize: true,
            brotliSize: true,
          }),
        ],
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("mapbox-gl") || id.includes("react-map-gl")) {
                return "mapbox";
              }
              if (id.includes("recharts")) {
                return "charts";
              }
              if (id.includes("flowbite-react")) {
                return "ui";
              }
              // その他はデフォルト分割
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
        },
      },
    },
  };
});
