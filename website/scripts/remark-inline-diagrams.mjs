import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";

const DIAGRAMS_SRC = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../blog/diagrams",
);

const IMG_TAG =
  /<img\b[^>]*\bsrc=["']\/blog\/diagrams\/([^"']+\.svg)["'][^>]*\/?>/gi;

/** Replace blog diagram <img> tags with inline SVG markup from blog/diagrams/. */
export function inlineDiagramImages(html, diagramsDir = DIAGRAMS_SRC) {
  return html.replace(IMG_TAG, (imgTag, filename) => {
    const svgPath = path.join(diagramsDir, filename);
    if (!existsSync(svgPath)) {
      console.warn(`remark-inline-diagrams: missing ${svgPath}`);
      return imgTag;
    }

    return readFileSync(svgPath, "utf-8")
      .trim()
      .replace(/<\?xml[^?]*\?>\s*/i, "");
  });
}

/** Remark plugin: inline SVG diagrams referenced from markdown HTML blocks. */
export function remarkInlineDiagrams() {
  return (tree) => {
    visit(tree, "html", (node) => {
      if (!node.value.includes("/blog/diagrams/")) return;
      node.value = inlineDiagramImages(node.value);
    });
  };
}
