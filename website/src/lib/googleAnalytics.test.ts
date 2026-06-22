import { describe, expect, it } from "vitest";
import {
  gtagScriptSrc,
  isValidGaMeasurementId,
  shouldEnableGoogleAnalytics,
} from "./googleAnalytics";

describe("isValidGaMeasurementId", () => {
  it("accepts standard GA4 ids", () => {
    expect(isValidGaMeasurementId("G-SXH9QJQQQL")).toBe(true);
  });

  it("rejects empty and malformed ids", () => {
    expect(isValidGaMeasurementId("")).toBe(false);
    expect(isValidGaMeasurementId("UA-123456-1")).toBe(false);
    expect(isValidGaMeasurementId("G-")).toBe(false);
  });
});

describe("shouldEnableGoogleAnalytics", () => {
  it("enables in production with a valid id", () => {
    expect(shouldEnableGoogleAnalytics(true, "G-SXH9QJQQQL")).toBe(true);
  });

  it("disables in development", () => {
    expect(shouldEnableGoogleAnalytics(false, "G-SXH9QJQQQL")).toBe(false);
  });

  it("disables when id is missing or invalid", () => {
    expect(shouldEnableGoogleAnalytics(true, "")).toBe(false);
    expect(shouldEnableGoogleAnalytics(true, "  ")).toBe(false);
    expect(shouldEnableGoogleAnalytics(true, "not-an-id")).toBe(false);
  });
});

describe("gtagScriptSrc", () => {
  it("builds the gtag loader url", () => {
    expect(gtagScriptSrc("G-SXH9QJQQQL")).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-SXH9QJQQQL",
    );
  });
});
