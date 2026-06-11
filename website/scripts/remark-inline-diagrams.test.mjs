import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inlineDiagramImages } from "./remark-inline-diagrams.mjs";

describe("inlineDiagramImages", () => {
  it("replaces img tags with inline svg from the diagrams directory", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "diagrams-"));
    writeFileSync(
      path.join(dir, "sample.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"><title>Sample</title></svg>',
    );

    const html = `<figure class="diagram">
  <img
    src="/blog/diagrams/sample.svg"
    alt="Sample diagram"
    width="480"
    height="300"
  />
  <figcaption>Caption</figcaption>
</figure>`;

    const result = inlineDiagramImages(html, dir);

    expect(result).toContain('<svg xmlns="http://www.w3.org/2000/svg">');
    expect(result).toContain("<figcaption>Caption</figcaption>");
    expect(result).not.toContain("<img");
  });

  it("keeps the original img tag when the svg file is missing", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "diagrams-missing-"));
    const img = '<img src="/blog/diagrams/missing.svg" alt="Missing" />';

    expect(inlineDiagramImages(img, dir)).toBe(img);
  });
});
