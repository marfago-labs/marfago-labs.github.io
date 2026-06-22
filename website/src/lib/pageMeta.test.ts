import { describe, expect, it } from "vitest";
import { formatPageDate, formatPageStamp } from "./pageMeta";

describe("formatPageDate", () => {
  it("formats dates in en-IE locale", () => {
    expect(formatPageDate(new Date("2026-06-21T12:00:00Z"))).toMatch(/21.*2026/);
  });
});

describe("formatPageStamp", () => {
  const published = new Date("2026-06-08T12:00:00Z");
  const sameDay = new Date("2026-06-08T18:00:00Z");
  const updated = new Date("2026-06-21T12:00:00Z");

  it("shows version and date only when published and updated match", () => {
    const stamp = formatPageStamp({
      version: "1.6",
      published,
      lastUpdated: sameDay,
    });
    expect(stamp).toMatch(/^v1\.6 · /);
    expect(stamp).not.toContain("Updated");
  });

  it("shows published and updated when they differ", () => {
    const stamp = formatPageStamp({
      version: "1.6",
      published,
      lastUpdated: updated,
    });
    expect(stamp).toContain("Published");
    expect(stamp).toContain("Updated");
  });

  it("defaults published to lastUpdated when omitted", () => {
    const stamp = formatPageStamp({
      version: "1.0",
      lastUpdated: updated,
    });
    expect(stamp).toMatch(/^v1\.0 · /);
    expect(stamp).not.toContain("Updated");
  });
});
