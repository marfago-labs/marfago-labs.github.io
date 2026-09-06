import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GOOGLE_SITE_VERIFICATION_TOKEN,
  googleSiteVerificationContent,
  isValidGoogleSiteVerificationToken,
} from "./googleSiteVerification";

const twentyChars = "A".repeat(20);
const nineteenChars = "A".repeat(19);

describe("GOOGLE_SITE_VERIFICATION_TOKEN", () => {
  it("is the Search Console HTML-tag token", () => {
    expect(GOOGLE_SITE_VERIFICATION_TOKEN).toBe(
      "sJg7T8DTZ-L-b2r4jbEYMCuKVZ6_Cd311AdeAy-5qQ8",
    );
  });
});

describe("isValidGoogleSiteVerificationToken", () => {
  it("accepts the live token and the 20-character floor", () => {
    expect(isValidGoogleSiteVerificationToken(GOOGLE_SITE_VERIFICATION_TOKEN)).toBe(
      true,
    );
    expect(isValidGoogleSiteVerificationToken(`  ${twentyChars}  `)).toBe(true);
  });

  it("rejects empty, short, and malformed tokens", () => {
    expect(isValidGoogleSiteVerificationToken("")).toBe(false);
    expect(isValidGoogleSiteVerificationToken("   ")).toBe(false);
    expect(isValidGoogleSiteVerificationToken(nineteenChars)).toBe(false);
    expect(isValidGoogleSiteVerificationToken(`${twentyChars}.`)).toBe(false);
    expect(isValidGoogleSiteVerificationToken(`${twentyChars}!`)).toBe(false);
    expect(isValidGoogleSiteVerificationToken(`x ${twentyChars}`)).toBe(false);
  });
});

describe("googleSiteVerificationContent", () => {
  it("returns the trimmed token when valid", () => {
    expect(googleSiteVerificationContent(GOOGLE_SITE_VERIFICATION_TOKEN)).toBe(
      GOOGLE_SITE_VERIFICATION_TOKEN,
    );
    expect(googleSiteVerificationContent(`  ${twentyChars}  `)).toBe(twentyChars);
  });

  it("returns null when the token is missing or invalid", () => {
    expect(googleSiteVerificationContent("")).toBeNull();
    expect(googleSiteVerificationContent("   ")).toBeNull();
    expect(googleSiteVerificationContent(nineteenChars)).toBeNull();
    expect(googleSiteVerificationContent(`${twentyChars}.`)).toBeNull();
  });
});

describe("layout wiring", () => {
  it("emits the meta tag from BaseLayout", () => {
    const layoutPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../layouts/BaseLayout.astro",
    );
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).toContain("GoogleSiteVerification");
  });
});
