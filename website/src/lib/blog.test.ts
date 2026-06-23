import { describe, expect, it } from "vitest";
import {
  type BlogPostEntry,
  getActLabel,
  getPostMetaLabel,
  isStandalonePost,
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

  it("splits series and standalone posts and sorts by order", () => {
    const { series, standalone } = partitionBlogPosts(posts);
    expect(series.map((p) => p.id)).toEqual([
      "00-series-index.md",
      "01-chapter.md",
    ]);
    expect(standalone.map((p) => p.id)).toEqual(["specs.md"]);
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
  });
});

describe("getPostMetaLabel", () => {
  it("returns series index, part, or standalone labels", () => {
    expect(getPostMetaLabel(0)).toBe("Series index");
    expect(getPostMetaLabel(2, "marfago-labs-origin")).toBe("Part 2");
    expect(getPostMetaLabel(9002)).toBe("Standalone");
  });
});
