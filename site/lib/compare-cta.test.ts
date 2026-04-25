// See docs/specs/website/landing-page.md §5.2
import { describe, expect, it } from "vitest";
import { buildCompareCtaHref } from "./compare-cta";
import type { CandidateIndexEntry } from "./candidates";

function entry(id: string, updatedAt: string): CandidateIndexEntry {
  return {
    id,
    displayName: id,
    party: "P",
    partyId: "p",
    isFictional: false,
    availableLocales: ["fr"],
    versionDate: "2026-01-01",
    updatedAt,
  };
}

describe("buildCompareCtaHref", () => {
  it("returns /comparer when no candidates are available", () => {
    expect(buildCompareCtaHref([])).toBe("/comparer");
  });

  it("returns /comparer when only one candidate is available", () => {
    expect(buildCompareCtaHref([entry("a", "2026-01-01")])).toBe("/comparer");
  });

  it("picks the two most recently updated when 3+ exist", () => {
    const entries = [
      entry("old", "2026-01-01"),
      entry("newest", "2026-03-01"),
      entry("middle", "2026-02-01"),
      entry("oldest", "2025-12-01"),
    ];
    expect(buildCompareCtaHref(entries)).toBe("/comparer?c=newest&c=middle");
  });

  it("picks the two most recently updated when exactly 2 exist", () => {
    const entries = [entry("a", "2026-01-01"), entry("b", "2026-02-01")];
    expect(buildCompareCtaHref(entries)).toBe("/comparer?c=b&c=a");
  });

  it("URL-encodes candidate ids containing hyphens (pass-through)", () => {
    const entries = [
      entry("alice-dupont", "2026-03-01"),
      entry("bob-martin", "2026-02-01"),
    ];
    const href = buildCompareCtaHref(entries);
    expect(href).toContain("c=alice-dupont");
    expect(href).toContain("c=bob-martin");
  });
});
