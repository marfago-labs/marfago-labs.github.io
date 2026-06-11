import { describe, expect, it } from "vitest";
import {
  countWords,
  formatReadingTime,
  pageReadingLabel,
  readingMinutes,
  WORDS_PER_MINUTE,
} from "./readingTime";

describe("countWords", () => {
  it("counts plain prose", () => {
    expect(countWords("one two three four")).toBe(4);
  });

  it("ignores fenced code blocks", () => {
    const text = "Intro paragraph.\n\n```ts\nconst x = 1;\n```\n\nOutro.";
    expect(countWords(text)).toBe(3);
  });

  it("ignores inline code", () => {
    expect(countWords("Use the CLI today")).toBe(4);
    expect(countWords("Use `npm run build` today")).toBe(2);
  });

  it("returns zero for empty or code-only content", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("```\nonly code\n```")).toBe(0);
  });
});

describe("readingMinutes", () => {
  it("rounds up at the configured WPM", () => {
    const words = "word ".repeat(WORDS_PER_MINUTE + 1);
    expect(readingMinutes(words)).toBe(2);
  });

  it("floors at one minute for short posts", () => {
    expect(readingMinutes("short post")).toBe(1);
    expect(readingMinutes("")).toBe(1);
  });
});

describe("formatReadingTime", () => {
  it("formats minutes with min read suffix", () => {
    expect(formatReadingTime(12)).toBe("12 min read");
  });
});

describe("pageReadingLabel", () => {
  it("combines page name and formatted reading time", () => {
    expect(pageReadingLabel("NER pipeline", "one two three four")).toBe(
      "NER pipeline · 1 min read",
    );
  });
});
