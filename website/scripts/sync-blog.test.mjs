import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const syncBlogModule = pathToFileURL(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "sync-blog.mjs"),
).href;

describe("syncBlog", () => {
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
    expect(synced).toContain('version: "1.6"');
  });
});
