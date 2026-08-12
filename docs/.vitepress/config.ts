import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "ja",
  base: "./",
  outDir: "../public/help",
  mpa: true,
  title: "47maps",
  description: "47maps ヘルプ",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "ヘルプ", link: "/" },
      { text: "ユーザーガイド", link: "/user-guide" },
      { text: "制限事項", link: "/limitations" },
    ],

    sidebar: [
      {
        text: "ガイド",
        items: [
          { text: "はじめに", link: "/index" },
          { text: "ユーザーガイド", link: "/user-guide" },
          { text: "制限事項", link: "/limitations" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/47stats/47maps-react" },
    ],
  },
});
