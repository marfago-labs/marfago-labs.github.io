import { defineConfig } from "astro/config";

// GitHub Pages project site at marfago-labs.github.io (org root)
export default defineConfig({
  site: "https://marfago-labs.github.io",
  base: "/",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
