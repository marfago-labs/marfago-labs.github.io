import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  applyBlogFreshness,
  bumpContentFreshnessPaths,
  bumpSitePageBlock,
  bumpVersionPatch,
  findLastMeaningfulChange,
  normalizeRepoPath,
  readBlogLastUpdated,
  readSitePageLastUpdated,
  splitFrontmatter,
  substantiveBlogContent,
  substantiveChanged,
  todayIsoLocal,
} from "./content-freshness.mjs";
import { backfillContentFreshness } from "./backfill-logic.mjs";

const samplePost = `---
title: "Example"
date: 2026-06-08
lastUpdated: 2026-06-08
version: "1.0"
description: One line.
---

# Body

First paragraph.
`;

const sampleSitePages = `export const sitePageMeta = {
  about: {
    version: "1.3",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-19"),
  },
} as const;
`;

describe("substantiveBlogContent", () => {
  it("ignores lastUpdated and version when comparing", () => {
    const a = substantiveBlogContent(samplePost);
    const b = substantiveBlogContent(
      samplePost
        .replace("lastUpdated: 2026-06-08", "lastUpdated: 2026-06-99")
        .replace('version: "1.0"', 'version: "9.9"'),
    );
    expect(a).toBe(b);
  });

  it("detects body edits", () => {
    expect(
      substantiveChanged(
        samplePost.replace("First paragraph.", "Second paragraph."),
        samplePost,
      ),
    ).toBe(true);
  });

  it("treats new files as changed", () => {
    expect(substantiveChanged(samplePost, null)).toBe(true);
  });
});

describe("splitFrontmatter", () => {
  it("returns the full body when frontmatter is missing", () => {
    expect(splitFrontmatter("# Title only")).toEqual({
      fm: "",
      body: "# Title only",
    });
  });
});

describe("todayIsoLocal", () => {
  it("formats a date in local ISO form", () => {
    expect(todayIsoLocal(new Date("2026-06-23T12:00:00"))).toBe("2026-06-23");
  });
});

describe("normalizeRepoPath", () => {
  it("normalizes windows and relative prefixes", () => {
    expect(normalizeRepoPath(".\\blog\\posts\\one.md")).toBe(
      "blog/posts/one.md",
    );
  });
});

describe("bumpVersionPatch", () => {
  it("returns the input when the version is not patch-shaped", () => {
    expect(bumpVersionPatch("beta")).toBe("beta");
  });
});

describe("applyBlogFreshness", () => {
  it("bumps lastUpdated and patch version", () => {
    const out = applyBlogFreshness(samplePost, "2026-06-23");
    expect(out).toContain("lastUpdated: 2026-06-23");
    expect(out).toContain('version: "1.1"');
    expect(out).toContain("First paragraph.");
  });

  it("keeps version when it is not patch-shaped", () => {
    const post = samplePost.replace('version: "1.0"', 'version: "beta"');
    const out = applyBlogFreshness(post, "2026-06-23");
    expect(out).toContain('version: "beta"');
  });

  it("adds lastUpdated when missing from frontmatter", () => {
    const bare = `---
title: "Example"
date: 2026-06-08
description: One line.
---

Body.
`;
    const out = applyBlogFreshness(bare, "2026-06-23");
    expect(out).toContain("lastUpdated: 2026-06-23");
  });
});

describe("bumpSitePageBlock", () => {
  it("updates lastUpdated and version for one page key", () => {
    const out = bumpSitePageBlock(sampleSitePages, "about", "2026-06-23");
    expect(out).toContain('version: "1.4"');
    expect(out).toContain('lastUpdated: new Date("2026-06-23")');
  });

  it("leaves content unchanged for unknown page keys", () => {
    expect(bumpSitePageBlock(sampleSitePages, "missing", "2026-06-23")).toBe(
      sampleSitePages,
    );
  });

  it("leaves content unchanged when lastUpdated and version are already current", () => {
    const alreadyCurrent = `export const sitePageMeta = {
  about: {
    version: "beta",
    published: new Date("2026-06-08"),
    lastUpdated: new Date("2026-06-23"),
  },
} as const;
`;
    expect(bumpSitePageBlock(alreadyCurrent, "about", "2026-06-23")).toBe(
      alreadyCurrent,
    );
  });
});

describe("bumpContentFreshnessPaths", () => {
  it("does not bump blog post when only lastUpdated changes", () => {
    const root = mkdtempSync(path.join(tmpdir(), "freshness-"));
    const postRel = "blog/posts/test.md";
    const postAbs = path.join(root, postRel);
    mkdirSync(path.dirname(postAbs), { recursive: true });
    const previous = samplePost;
    writeFileSync(
      postAbs,
      samplePost.replace("lastUpdated: 2026-06-08", "lastUpdated: 2026-06-10"),
    );

    const changed = bumpContentFreshnessPaths([postRel], {
      today: "2026-06-23",
      readCurrent: (p) => readFileSync(path.join(root, p), "utf8"),
      readPrevious: () => previous,
      writeCurrent: (p, content) =>
        writeFileSync(path.join(root, p), content),
    });
    expect(changed).toEqual([]);
  });

  it("bumps blog post when body changes", () => {
    const root = mkdtempSync(path.join(tmpdir(), "freshness-"));
    const postRel = "blog/posts/test.md";
    const postAbs = path.join(root, postRel);
    mkdirSync(path.dirname(postAbs), { recursive: true });
    writeFileSync(
      postAbs,
      samplePost.replace("First paragraph.", "Edited paragraph."),
    );

    const changed = bumpContentFreshnessPaths([postRel], {
      today: "2026-06-23",
      readCurrent: (p) => readFileSync(path.join(root, p), "utf8"),
      readPrevious: () => samplePost,
      writeCurrent: (p, content) =>
        writeFileSync(path.join(root, p), content),
    });
    expect(changed).toEqual([postRel]);
    expect(readFileSync(postAbs, "utf8")).toContain("lastUpdated: 2026-06-23");
  });

  it("bumps site-pages when about.astro changes", () => {
    const root = mkdtempSync(path.join(tmpdir(), "freshness-"));
    const aboutRel = "website/src/pages/about.astro";
    const metaRel = "website/src/data/site-pages.ts";
    mkdirSync(path.dirname(path.join(root, aboutRel)), { recursive: true });
    mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
    writeFileSync(path.join(root, metaRel), sampleSitePages);
    writeFileSync(path.join(root, aboutRel), "<p>New about</p>");

    const changed = bumpContentFreshnessPaths([aboutRel], {
      today: "2026-06-23",
      readCurrent: (p) => readFileSync(path.join(root, p), "utf8"),
      readPrevious: (p) => (p === aboutRel ? "<p>Old about</p>" : null),
      writeCurrent: (p, content) =>
        writeFileSync(path.join(root, p), content),
    });
    expect(changed).toContain(aboutRel);
    expect(changed).toContain(metaRel);
    expect(readFileSync(path.join(root, metaRel), "utf8")).toContain(
      'lastUpdated: new Date("2026-06-23")',
    );
  });

  it("ignores unrelated paths", () => {
    const changed = bumpContentFreshnessPaths(["website/src/lib/foo.ts"], {
      readCurrent: () => "new",
      readPrevious: () => "old",
      writeCurrent: () => {},
    });
    expect(changed).toEqual([]);
  });

  it("skips site pages when content matches HEAD", () => {
    const aboutRel = "website/src/pages/about.astro";
    const changed = bumpContentFreshnessPaths([aboutRel], {
      today: "2026-06-23",
      readCurrent: () => "<p>Same</p>",
      readPrevious: () => "<p>Same</p>",
      writeCurrent: () => {},
    });
    expect(changed).toEqual([]);
  });

  it("bumps site-pages when a mapped page is new", () => {
    const root = mkdtempSync(path.join(tmpdir(), "freshness-new-site-"));
    const aboutRel = "website/src/pages/about.astro";
    const metaRel = "website/src/data/site-pages.ts";
    mkdirSync(path.dirname(path.join(root, aboutRel)), { recursive: true });
    mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
    writeFileSync(path.join(root, metaRel), sampleSitePages);
    writeFileSync(path.join(root, aboutRel), "<p>New about</p>");

    const changed = bumpContentFreshnessPaths([aboutRel], {
      today: "2026-06-23",
      readCurrent: (p) => readFileSync(path.join(root, p), "utf8"),
      readPrevious: () => null,
      writeCurrent: (p, content) =>
        writeFileSync(path.join(root, p), content),
    });
    expect(changed).toContain(aboutRel);
    expect(changed).toContain(metaRel);
  });
});

describe("readBlogLastUpdated", () => {
  it("reads lastUpdated when present", () => {
    expect(readBlogLastUpdated(samplePost)).toBe("2026-06-08");
  });

  it("falls back to date when lastUpdated is missing", () => {
    const bare = samplePost.replace("lastUpdated: 2026-06-08\n", "");
    expect(readBlogLastUpdated(bare)).toBe("2026-06-08");
  });

  it("returns null when no date fields exist", () => {
    expect(readBlogLastUpdated("# no frontmatter")).toBeNull();
  });
});

describe("readSitePageLastUpdated", () => {
  it("reads lastUpdated for a page key", () => {
    expect(readSitePageLastUpdated(sampleSitePages, "about")).toBe("2026-06-19");
  });

  it("returns null for an unknown page key", () => {
    expect(readSitePageLastUpdated(sampleSitePages, "missing")).toBeNull();
  });
});

describe("findLastMeaningfulChange", () => {
  it("returns the newest commit with substantive change", () => {
    const date = findLastMeaningfulChange(
      [
        {
          date: "2026-06-23",
          content: "same",
          parentContent: "same",
        },
        {
          date: "2026-06-21",
          content: "new body",
          parentContent: "old body",
        },
      ],
      (current, previous) => current !== previous,
    );
    expect(date).toBe("2026-06-21");
  });

  it("returns null when there is no history", () => {
    expect(findLastMeaningfulChange([], (current, previous) => current !== previous)).toBeNull();
  });

  it("falls back to the oldest commit when head revisions are unchanged", () => {
    const date = findLastMeaningfulChange(
      [
        { date: "2026-06-23", content: "same", parentContent: "same" },
        { date: "2026-06-20", content: "same", parentContent: "same" },
      ],
      (current, previous) => current !== previous,
    );
    expect(date).toBe("2026-06-20");
  });
});

describe("backfillContentFreshness", () => {
  it("bumps blog posts when git history is newer than stored lastUpdated", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-"));
    const postRel = "blog/posts/test.md";
    const postAbs = path.join(root, postRel);
    mkdirSync(path.dirname(postAbs), { recursive: true });
    writeFileSync(postAbs, samplePost);

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: () => [
        {
          date: "2026-06-23",
          content: samplePost.replace("First paragraph.", "Edited."),
          parentContent: samplePost,
        },
      ],
    });

    expect(changed).toEqual([postRel]);
    expect(readFileSync(postAbs, "utf8")).toContain("lastUpdated: 2026-06-23");
  });

  it("skips blog posts when stored lastUpdated is already current", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-"));
    const postRel = "blog/posts/test.md";
    const postAbs = path.join(root, postRel);
    mkdirSync(path.dirname(postAbs), { recursive: true });
    writeFileSync(
      postAbs,
      samplePost.replace("lastUpdated: 2026-06-08", "lastUpdated: 2026-06-23"),
    );

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: () => [
        {
          date: "2026-06-23",
          content: samplePost.replace("First paragraph.", "Edited."),
          parentContent: samplePost,
        },
      ],
    });

    expect(changed).toEqual([]);
  });

  it("skips non-markdown files in the blog directory", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-skip-"));
    const blogDir = path.join(root, "blog/posts");
    mkdirSync(blogDir, { recursive: true });
    writeFileSync(path.join(blogDir, "notes.txt"), "ignore me");

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: () => {
        throw new Error("should not read history for skipped files");
      },
    });

    expect(changed).toEqual([]);
  });

  it("skips posts when git history has no substantive change date", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-null-date-"));
    const postRel = "blog/posts/test.md";
    const postAbs = path.join(root, postRel);
    mkdirSync(path.dirname(postAbs), { recursive: true });
    writeFileSync(postAbs, samplePost);

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: () => [],
    });

    expect(changed).toEqual([]);
  });

  it("updates site-pages when mapped astro history is newer", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-"));
    const aboutRel = "website/src/pages/about.astro";
    const metaRel = "website/src/data/site-pages.ts";
    mkdirSync(path.dirname(path.join(root, aboutRel)), { recursive: true });
    mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
    writeFileSync(path.join(root, metaRel), sampleSitePages);
    writeFileSync(path.join(root, aboutRel), "<p>New about</p>");

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: (rel) =>
        rel === aboutRel
          ? [
              {
                date: "2026-06-23",
                content: "<p>New about</p>",
                parentContent: "<p>Old about</p>",
              },
            ]
          : [],
    });

    expect(changed).toContain(aboutRel);
    expect(changed).toContain(metaRel);
    expect(readFileSync(path.join(root, metaRel), "utf8")).toContain(
      'lastUpdated: new Date("2026-06-23")',
    );
  });

  it("leaves site-pages unchanged when astro history is not newer", () => {
    const root = mkdtempSync(path.join(tmpdir(), "backfill-"));
    const aboutRel = "website/src/pages/about.astro";
    const metaRel = "website/src/data/site-pages.ts";
    mkdirSync(path.dirname(path.join(root, aboutRel)), { recursive: true });
    mkdirSync(path.dirname(path.join(root, metaRel)), { recursive: true });
    writeFileSync(path.join(root, metaRel), sampleSitePages);
    writeFileSync(path.join(root, aboutRel), "<p>New about</p>");

    const changed = backfillContentFreshness({
      repoRoot: root,
      historyFor: (rel) =>
        rel === aboutRel
          ? [
              {
                date: "2026-06-19",
                content: "<p>New about</p>",
                parentContent: "<p>Old about</p>",
              },
            ]
          : [],
    });

    expect(changed).toEqual([]);
  });
});
