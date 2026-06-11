import { defineConfig } from "astro/config";
import { remarkMermaid } from "./scripts/remark-mermaid.mjs";
import { remarkInlineDiagrams } from "./scripts/remark-inline-diagrams.mjs";
import { syncBlogPlugin } from "./scripts/sync-blog-plugin.mjs";

// GitHub Pages project site at marfago-labs.github.io (org root)
export default defineConfig({
  vite: {
    plugins: [syncBlogPlugin()],
  },
  site: "https://marfago-labs.github.io",
  base: "/",
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [remarkMermaid, remarkInlineDiagrams],
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
