import { describe, expect, it } from "vitest";
import { safeInternalRedirect } from "@/lib/safeRedirect";

describe("safeInternalRedirect", () => {
  it("allows same-origin relative paths", () => {
    expect(safeInternalRedirect("/app/feed")).toBe("/app/feed");
    expect(safeInternalRedirect("/app/feed?tab=latest#top")).toBe("/app/feed?tab=latest#top");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeInternalRedirect("https://evil.example")).toBeNull();
    expect(safeInternalRedirect("//evil.example")).toBeNull();
    expect(safeInternalRedirect("%2F%2Fevil.example")).toBeNull();
    expect(safeInternalRedirect("/\\evil.example")).toBeNull();
  });

  it("uses the fallback for auth-loop redirects", () => {
    expect(safeInternalRedirect("/signin", "/app/feed")).toBe("/app/feed");
    expect(safeInternalRedirect("/signup?redirect=/app/feed", "/app/feed")).toBe("/app/feed");
  });
});
