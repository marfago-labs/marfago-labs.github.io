import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inlineDiagramImages, remarkInlineDiagrams } from "./remark-inline-diagrams.mjs";

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

describe("remarkInlineDiagrams", () => {
  it("inlines diagram img tags on html nodes", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "diagrams-remark-"));
    writeFileSync(
      path.join(dir, "flow.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"><circle /></svg>',
    );

    const tree = {
      type: "root",
      children: [
        {
          type: "html",
          value: '<img src="/blog/diagrams/flow.svg" alt="Flow" />',
        },
      ],
    };

    remarkInlineDiagrams({ diagramsDir: dir })(tree);

    expect(tree.children[0].value).toContain("<circle");
    expect(tree.children[0].value).not.toContain("<img");
  });

  it("ignores html nodes without diagram paths", () => {
    const tree = {
      type: "root",
      children: [{ type: "html", value: "<p>plain</p>" }],
    };
    remarkInlineDiagrams()(tree);
    expect(tree.children[0].value).toBe("<p>plain</p>");
  });

  it("strips xml prolog from inlined svg", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "diagrams-xml-"));
    writeFileSync(
      path.join(dir, "with-xml.svg"),
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>',
    );
    const html = '<img src="/blog/diagrams/with-xml.svg" alt="X" />';
    const result = inlineDiagramImages(html, dir);
    expect(result).not.toContain("<?xml");
    expect(result).toContain("<svg");
  });
});
