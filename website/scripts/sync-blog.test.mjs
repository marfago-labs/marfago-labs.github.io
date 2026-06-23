import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const syncBlogModule = pathToFileURL(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "sync-blog.mjs"),
).href;

describe("syncBlog helpers", () => {
  it("parseSlug reads slug from frontmatter", async () => {
    const { parseSlug } = await import(syncBlogModule);
    const raw = `---
title: Example
slug: my-post
---
Body`;
    expect(parseSlug(raw)).toBe("my-post");
  });

  it("parseSlug returns null without slug frontmatter", async () => {
    const { parseSlug } = await import(syncBlogModule);
    expect(parseSlug("# Title only\n")).toBeNull();
  });

  it("rewriteLinks maps relative post paths to /blog/slug/", async () => {
    const { rewriteLinks } = await import(syncBlogModule);
    const body = "See [Part 2](./02-compress-then-embed.md) next.";
    const out = rewriteLinks(body, { "02-compress-then-embed.md": "compress-then-embed" });
    expect(out).toContain("](/blog/compress-then-embed/)");
  });

  it("stripSlugFromFrontmatter removes slug lines", async () => {
    const { stripSlugFromFrontmatter } = await import(syncBlogModule);
    expect(
      stripSlugFromFrontmatter('title: "X"\nslug: foo\norder: 1'),
    ).toBe('title: "X"\norder: 1');
  });
});

describe("syncBlog", () => {
  it("returns 0 when blog source is missing", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-missing-"));
    expect(
      syncBlog({
        quiet: true,
        roots: {
          srcDir: path.join(dir, "missing-posts"),
          destDir: path.join(dir, "out"),
          coversSrc: path.join(dir, "no-covers"),
          coversDest: path.join(dir, "out-covers"),
          diagramsSrc: path.join(dir, "no-diagrams"),
          diagramsDest: path.join(dir, "out-diagrams"),
        },
      }),
    ).toBe(0);
  });

  it("warns when blog source is missing and not quiet", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-warn-"));
    const missingSrc = path.join(dir, "missing-posts");
    const warnings = [];
    const original = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    try {
      syncBlog({
        quiet: false,
        roots: {
          srcDir: missingSrc,
          destDir: path.join(dir, "out"),
          coversSrc: path.join(dir, "no-covers"),
          coversDest: path.join(dir, "out-covers"),
          diagramsSrc: path.join(dir, "no-diagrams"),
          diagramsDest: path.join(dir, "out-diagrams"),
        },
      });
    } finally {
      console.warn = original;
    }

    expect(warnings.some((line) => line.includes("source missing"))).toBe(true);
  });

  it("syncs posts into a temp destination and strips slug", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-temp-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      path.join(srcDir, "01-example.md"),
      `---
title: Example
slug: example-slug
---
See [two](./02-other.md).
`,
    );
    writeFileSync(
      path.join(srcDir, "02-other.md"),
      `---
title: Two
slug: other-slug
---
Body
`,
    );

    const count = syncBlog({
      quiet: true,
      roots: {
        srcDir,
        destDir,
        coversSrc: path.join(dir, "no-covers"),
        coversDest: path.join(dir, "out-covers"),
        diagramsSrc: path.join(dir, "no-diagrams"),
        diagramsDest: path.join(dir, "out-diagrams"),
      },
    });

    expect(count).toBe(2);
    const synced = readFileSync(path.join(destDir, "01-example.md"), "utf8");
    expect(synced).not.toMatch(/^slug:/m);
    expect(synced).toContain("](/blog/other-slug/)");
  });

  it("copies markdown without frontmatter unchanged", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-plain-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(path.join(srcDir, "plain.md"), "# No frontmatter\n");

    syncBlog({
      quiet: true,
      roots: {
        srcDir,
        destDir,
        coversSrc: path.join(dir, "no-covers"),
        coversDest: path.join(dir, "out-covers"),
        diagramsSrc: path.join(dir, "no-diagrams"),
        diagramsDest: path.join(dir, "out-diagrams"),
      },
    });

    expect(readFileSync(path.join(destDir, "plain.md"), "utf8")).toBe("# No frontmatter\n");
  });

  it("removes stale markdown from the destination", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-stale-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(destDir, { recursive: true });
    writeFileSync(path.join(srcDir, "keep.md"), "# Keep\n");
    writeFileSync(path.join(destDir, "stale.md"), "# Stale\n");

    syncBlog({
      quiet: true,
      roots: {
        srcDir,
        destDir,
        coversSrc: path.join(dir, "no-covers"),
        coversDest: path.join(dir, "out-covers"),
        diagramsSrc: path.join(dir, "no-diagrams"),
        diagramsDest: path.join(dir, "out-diagrams"),
      },
    });

    expect(() => readFileSync(path.join(destDir, "stale.md"), "utf8")).toThrow();
    expect(readFileSync(path.join(destDir, "keep.md"), "utf8")).toBe("# Keep\n");
  });

  it("syncs cover assets when present", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-covers-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    const coversSrc = path.join(dir, "covers");
    const coversDest = path.join(dir, "out-covers");
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(coversSrc, { recursive: true });
    writeFileSync(path.join(srcDir, "post.md"), "# Post\n");
    writeFileSync(path.join(coversSrc, "hero.png"), "png");
    const logs = [];
    const original = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      syncBlog({
        quiet: false,
        roots: {
          srcDir,
          destDir,
          coversSrc,
          coversDest,
          diagramsSrc: path.join(dir, "no-diagrams"),
          diagramsDest: path.join(dir, "out-diagrams"),
        },
      });
    } finally {
      console.log = original;
    }

    expect(readFileSync(path.join(coversDest, "hero.png"), "utf8")).toBe("png");
    expect(logs.some((line) => line.includes("synced 1 covers"))).toBe(true);
  });

  it("syncs diagram assets and clears astro cache when requested", async () => {
    const { syncBlog, clearAstroContentCache } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-diagrams-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    const diagramsSrc = path.join(dir, "diagrams");
    const diagramsDest = path.join(dir, "out-diagrams");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(path.join(srcDir, "post.md"), "# Post\n");
    mkdirSync(diagramsSrc, { recursive: true });
    writeFileSync(path.join(diagramsSrc, "flow.svg"), "<svg></svg>");

    syncBlog({
      quiet: true,
      invalidateDiagramCache: true,
      roots: {
        srcDir,
        destDir,
        coversSrc: path.join(dir, "no-covers"),
        coversDest: path.join(dir, "out-covers"),
        diagramsSrc,
        diagramsDest,
      },
    });

    expect(readFileSync(path.join(diagramsDest, "flow.svg"), "utf8")).toBe("<svg></svg>");
    clearAstroContentCache();
  });

  it("logs sync summary when not quiet", async () => {
    const { syncBlog } = await import(syncBlogModule);
    const dir = mkdtempSync(path.join(tmpdir(), "sync-blog-log-"));
    const srcDir = path.join(dir, "posts");
    const destDir = path.join(dir, "content");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(path.join(srcDir, "one.md"), "# One\n");
    const logs = [];
    const original = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      syncBlog({
        quiet: false,
        roots: {
          srcDir,
          destDir,
          coversSrc: path.join(dir, "no-covers"),
          coversDest: path.join(dir, "out-covers"),
          diagramsSrc: path.join(dir, "no-diagrams"),
          diagramsDest: path.join(dir, "out-diagrams"),
        },
      });
    } finally {
      console.log = original;
    }

    expect(logs.some((line) => line.includes("synced 1 posts"))).toBe(true);
  });

  it("strips slug from synced blog frontmatter", async () => {
    const { syncBlog } = await import(syncBlogModule);
    syncBlog({ quiet: true });

    const synced = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../src/content/blog/specs-drive-tests-validate.md",
      ),
      "utf8",
    );

    expect(synced).not.toMatch(/^slug:/m);
    expect(synced).toMatch(/version: "1\.\d+"/);
  });

  it("rewrites internal markdown links to site paths", async () => {
    const { syncBlog } = await import(syncBlogModule);
    syncBlog({ quiet: true });

    const synced = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../src/content/blog/00-series-index.md",
      ),
      "utf8",
    );

    expect(synced).toMatch(/\]\(\/blog\/[^)]+\/\)/);
    expect(synced).not.toMatch(/\]\(\.\/[^)]+\.md\)/);
  });

  it("clearAstroContentCache removes data-store when present", async () => {
    const { clearAstroContentCache } = await import(syncBlogModule);
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const astroDir = path.join(root, ".astro");
    mkdirSync(astroDir, { recursive: true });
    const store = path.join(astroDir, "data-store.json");
    writeFileSync(store, "{}");
    clearAstroContentCache();
    expect(() => readFileSync(store, "utf8")).toThrow();
  });
});
