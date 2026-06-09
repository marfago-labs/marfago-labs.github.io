import { visit } from "unist-util-visit";

/** Turn ```mermaid fences into <div class="mermaid"> for client-side rendering. */
export function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || parent == null || index == null) return;
      parent.children[index] = {
        type: "html",
        value: `<div class="mermaid">${node.value}</div>`,
      };
    });
  };
}
