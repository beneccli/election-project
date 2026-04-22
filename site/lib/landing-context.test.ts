import { describe, expect, it } from "vitest";
import {
  CONTEXT_SERIES,
  CONTEXT_STATS,
  getContextSeries,
} from "./landing-context";

describe("landing-context", () => {
  it("exposes three headline stats with bilingual labels", () => {
    expect(CONTEXT_STATS).toHaveLength(3);
    const keys = CONTEXT_STATS.map((s) => s.key).sort();
    expect(keys).toEqual(["carbonNeutrality", "debt", "deficit"]);
    for (const s of CONTEXT_STATS) {
      expect(s.headline.length).toBeGreaterThan(0);
      expect(s.label.fr.length).toBeGreaterThan(0);
      expect(s.label.en.length).toBeGreaterThan(0);
      expect(s.sourceNote.fr.length).toBeGreaterThan(0);
    }
  });

  it("exposes debt and demographics series", () => {
    expect(CONTEXT_SERIES).toHaveLength(2);
    expect(getContextSeries("debt").key).toBe("debt");
    expect(getContextSeries("demographics").key).toBe("demographics");
  });

  it("series points have strictly increasing years and in-range values", () => {
    for (const s of CONTEXT_SERIES) {
      expect(s.points.length).toBeGreaterThan(2);
      for (let i = 1; i < s.points.length; i++) {
        expect(s.points[i][0]).toBeGreaterThan(s.points[i - 1][0]);
      }
      for (const [, v] of s.points) {
        expect(v).toBeGreaterThanOrEqual(s.yMin);
        expect(v).toBeLessThanOrEqual(s.yMax);
      }
    }
  });

  it("demographics series marks a projection year that exists in points", () => {
    const demo = getContextSeries("demographics");
    expect(demo.projectionFrom).toBe(2025);
    const years = demo.points.map(([y]) => y);
    expect(years).toContain(demo.projectionFrom);
  });

  it("debt series carries a Maastricht reference line", () => {
    const debt = getContextSeries("debt");
    expect(debt.refLine?.y).toBe(60);
    expect(debt.refLine?.label.fr).toMatch(/Maastricht/);
  });

  it("every series cites a source URL (http/https)", () => {
    for (const s of CONTEXT_SERIES) {
      expect(s.source.url).toMatch(/^https?:\/\//);
    }
  });

  it("throws on an unknown series key", () => {
    // @ts-expect-error — testing runtime guard
    expect(() => getContextSeries("nope")).toThrow(/Unknown context series/);
  });
});
