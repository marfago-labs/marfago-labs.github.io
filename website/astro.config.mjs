import { defineConfig } from "astro/config";
import { remarkMermaid } from "./scripts/remark-mermaid.mjs";

// GitHub Pages project site at marfago-labs.github.io (org root)
export default defineConfig({
  site: "https://marfago-labs.github.io",
  base: "/",
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [remarkMermaid],
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
