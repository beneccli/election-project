// See docs/specs/website/nextjs-architecture.md §3.2
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AggregatedOutputSchema, type AggregatedOutput } from "../schema";
import { deriveSynthese, SYNTHESE_EMPTY_FALLBACK } from "./synthese-selection";
import { DIMENSION_KEYS } from "./keys";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REAL_OMEGA = path.resolve(
  HERE,
  "..",
  "..",
  "..",
  "candidates",
  "test-omega",
  "current",
  "aggregated.json",
);

function loadFixture(): AggregatedOutput {
  return AggregatedOutputSchema.parse(
    JSON.parse(fs.readFileSync(REAL_OMEGA, "utf8")),
  );
}

describe("deriveSynthese", () => {
  it("returns at most 3 items per list for test-omega", () => {
    const { strengths, weaknesses, gaps } = deriveSynthese(loadFixture());
    expect(strengths.length).toBeLessThanOrEqual(3);
    expect(weaknesses.length).toBeLessThanOrEqual(3);
    expect(gaps.length).toBeLessThanOrEqual(3);
  });

  it("filters strengths at strength >= 0.7", () => {
    const agg = loadFixture();
    for (const k of DIMENSION_KEYS) agg.dimensions[k].problems_addressed = [];
    agg.dimensions.economic_fiscal.problems_addressed = [
      {
        problem: "Keep",
        approach: "x",
        strength: 0.7,
        source_refs: [{ type: "program", locator: "p1" }],
        reasoning: "r",
        supported_by: ["m1"],
        dissenters: [],
      },
      {
        problem: "Drop",
        approach: "x",
        strength: 0.69,
        source_refs: [{ type: "program", locator: "p1" }],
        reasoning: "r",
        supported_by: ["m1"],
        dissenters: [],
      },
    ];
    const { strengths } = deriveSynthese(agg);
    expect(strengths.map((s) => s.text)).toEqual(["Keep"]);
  });

  it("returns empty arrays when no content qualifies", () => {
    const agg = loadFixture();
    for (const k of DIMENSION_KEYS) {
      agg.dimensions[k].problems_addressed = [];
      agg.dimensions[k].problems_worsened = [];
    }
    agg.unsolved_problems = [];
    const out = deriveSynthese(agg);
    expect(out.strengths).toEqual([]);
    expect(out.weaknesses).toEqual([]);
    expect(out.gaps).toEqual([]);
  });

  it("returns partial lists (< 3) when fewer items exist", () => {
    const agg = loadFixture();
    for (const k of DIMENSION_KEYS) {
      agg.dimensions[k].problems_addressed = [];
      agg.dimensions[k].problems_worsened = [];
    }
    agg.unsolved_problems = [
      {
        problem: "Only one gap",
        why_unsolved: "x",
        severity_if_unsolved: "high",
        source_refs: [],
        supported_by: ["m1"],
        dissenters: [],
      },
    ];
    const out = deriveSynthese(agg);
    expect(out.gaps).toHaveLength(1);
    expect(out.gaps[0].text).toBe("Only one gap");
  });

  it("sorts gaps by severity (high > medium > low)", () => {
    const agg = loadFixture();
    agg.unsolved_problems = [
      {
        problem: "Low gap",
        why_unsolved: "x",
        severity_if_unsolved: "low",
        source_refs: [],
        supported_by: ["m1"],
        dissenters: [],
      },
      {
        problem: "High gap",
        why_unsolved: "x",
        severity_if_unsolved: "high",
        source_refs: [],
        supported_by: ["m1"],
        dissenters: [],
      },
      {
        problem: "Medium gap",
        why_unsolved: "x",
        severity_if_unsolved: "medium",
        source_refs: [],
        supported_by: ["m1"],
        dissenters: [],
      },
    ];
    const { gaps } = deriveSynthese(agg);
    expect(gaps.map((g) => g.text)).toEqual([
      "High gap",
      "Medium gap",
      "Low gap",
    ]);
  });

  it("exposes the neutral empty-fallback string for callers", () => {
    expect(SYNTHESE_EMPTY_FALLBACK).toBe(
      "Aucun élément marquant identifié dans cette analyse",
    );
  });
});
