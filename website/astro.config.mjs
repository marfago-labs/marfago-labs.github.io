import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { remarkMermaid } from "./scripts/remark-mermaid.mjs";
import { remarkInlineDiagrams } from "./scripts/remark-inline-diagrams.mjs";
import { syncBlogPlugin } from "./scripts/sync-blog-plugin.mjs";

// GitHub Pages project site at marfago-labs.github.io (org root)
export default defineConfig({
  // Astro 7 defaults to React-style whitespace rules, which drop the space before an inline tag at a line break.
  compressHTML: true,
  vite: {
    plugins: [syncBlogPlugin()],
  },
  site: "https://marfago-labs.github.io",
  base: "/",
  trailingSlash: "always",
  markdown: {
    processor: unified({ remarkPlugins: [remarkMermaid, remarkInlineDiagrams] }),
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
