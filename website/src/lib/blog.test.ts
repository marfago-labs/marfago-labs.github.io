import { describe, expect, it } from "vitest";
import {
  type BlogPostEntry,
  getActLabel,
  getPostMetaLabel,
  isStandalonePost,
  newestFirst,
  partitionBlogPosts,
  postSlug,
  STANDALONE_ORDER_MIN,
} from "./blog";

const testDate = new Date("2024-01-01");

describe("postSlug", () => {
  it("strips numeric prefix from series filenames", () => {
    expect(postSlug("01-i-didnt-want-another-bookmark-app.md")).toBe(
      "i-didnt-want-another-bookmark-app",
    );
  });

  it("keeps standalone slugs unchanged", () => {
    expect(postSlug("specs-drive-tests-validate.md")).toBe(
      "specs-drive-tests-validate",
    );
  });
});

describe("isStandalonePost", () => {
  it("treats missing series as standalone", () => {
    expect(isStandalonePost(undefined, 9002)).toBe(true);
  });

  it("treats series with high order as standalone", () => {
    expect(isStandalonePost("marfago-labs-origin", STANDALONE_ORDER_MIN)).toBe(true);
  });

  it("treats in-series posts as not standalone", () => {
    expect(isStandalonePost("marfago-labs-origin", 3)).toBe(false);
  });

  it("treats series posts without order as in-series", () => {
    expect(isStandalonePost("marfago-labs-origin", undefined)).toBe(false);
  });
});

describe("newestFirst", () => {
  const post = (title: string, date: string) => ({
    data: { title, date: new Date(date) },
  });

  it("puts the later date first", () => {
    expect(newestFirst(post("A", "2026-06-19"), post("B", "2026-06-21"))).toBeGreaterThan(0);
    expect(newestFirst(post("B", "2026-06-21"), post("A", "2026-06-19"))).toBeLessThan(0);
  });

  it("sorts a shared day by title", () => {
    expect(newestFirst(post("Alpha", "2026-06-21"), post("Beta", "2026-06-21"))).toBeLessThan(0);
    expect(newestFirst(post("Beta", "2026-06-21"), post("Alpha", "2026-06-21"))).toBeGreaterThan(0);
  });
});

describe("partitionBlogPosts", () => {
  const posts: BlogPostEntry[] = [
    {
      id: "00-series-index.md",
      data: {
        series: "marfago-labs-origin",
        order: 0,
        title: "Index",
        description: "Series index",
        date: testDate,
      },
    },
    {
      id: "01-chapter.md",
      data: {
        series: "marfago-labs-origin",
        order: 1,
        title: "One",
        description: "Chapter one",
        date: testDate,
      },
    },
    {
      id: "specs.md",
      data: {
        order: 9002,
        title: "Specs",
        description: "Standalone specs",
        date: testDate,
      },
    },
  ];

  it("splits series and standalone posts and sorts the series by order", () => {
    const { series, standalone } = partitionBlogPosts(posts);
    expect(series.map((p) => p.id)).toEqual([
      "00-series-index.md",
      "01-chapter.md",
    ]);
    expect(standalone.map((p) => p.id)).toEqual(["specs.md"]);
  });

  it("puts the newest standalone post first, and sorts a shared day by title", () => {
    const standalone = (id: string, title: string, date: string, order: number) => ({
      id,
      data: { order, title, description: title, date: new Date(date) },
    });
    const result = partitionBlogPosts([
      standalone("old.md", "Old", "2026-06-19", 9001),
      standalone("b.md", "Beta", "2026-06-21", 9003),
      standalone("a.md", "Alpha", "2026-06-21", 9002),
      standalone("new.md", "New", "2026-11-17", 9004),
    ]);
    expect(result.standalone.map((p) => p.id)).toEqual([
      "new.md",
      "a.md",
      "b.md",
      "old.md",
    ]);
  });
});

describe("getActLabel", () => {
  it("labels standalone and prologue", () => {
    expect(getActLabel(9002)).toBe("Standalone");
    expect(getActLabel(0, "marfago-labs-origin")).toBe("Prologue");
  });

  it("maps order bands to acts", () => {
    expect(getActLabel(1, "marfago-labs-origin")).toBe("Act I: The Illusion");
    expect(getActLabel(3, "marfago-labs-origin")).toBe("Act II: The Reality Check");
    expect(getActLabel(5, "marfago-labs-origin")).toBe("Act III: The Infrastructure");
    expect(getActLabel(7, "marfago-labs-origin")).toBe("Act IV: The Philosophy");
    expect(getActLabel(8, "marfago-labs-origin")).toBe("Act V: Back to the Product");
    expect(getActLabel(9, "marfago-labs-origin")).toBe("Act V: Back to the Product");
  });
});

describe("getPostMetaLabel", () => {
  it("returns series index, part, or standalone labels", () => {
    expect(getPostMetaLabel(0)).toBe("Series index");
    expect(getPostMetaLabel(2, "marfago-labs-origin")).toBe("Part 2");
    expect(getPostMetaLabel(9002)).toBe("Standalone");
  });
});
