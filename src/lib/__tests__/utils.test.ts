import { describe, it, expect } from "vitest";
import { generateSlug } from "../utils";

describe("generateSlug", () => {
  it("converts ASCII org name to kebab-case", () => {
    expect(generateSlug("Tata Consultancy Services")).toBe("tata-consultancy-services");
  });

  it("strips special chars and keeps numbers", () => {
    expect(generateSlug("L&T Infotech 2024")).toBe("lt-infotech-2024");
  });

  it("handles Telugu / non-Latin names gracefully", () => {
    const slug = generateSlug("వేెనవర్సే ప్రైవేట్");
    expect(slug).not.toMatch(/^-/);
    expect(slug).not.toMatch(/-$/);
    expect(slug).not.toBe("---");
    // Should fall back to 'untitled' if all chars are stripped
    expect(slug.length).toBeGreaterThan(0);
  });

  it('returns "untitled" for empty string', () => {
    expect(generateSlug("")).toBe("untitled");
  });

  it('returns "untitled" for whitespace-only input', () => {
    expect(generateSlug("   ")).toBe("untitled");
  });
});
