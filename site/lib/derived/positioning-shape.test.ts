// See docs/specs/website/nextjs-architecture.md §3.3
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AggregatedOutputSchema, type AggregatedOutput } from "../schema";
import { deriveRadarShape } from "./positioning-shape";

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

describe("deriveRadarShape", () => {
  it("returns 5 axes in canonical order", () => {
    const { axes } = deriveRadarShape(loadFixture().positioning);
    expect(axes.map((a) => a.key)).toEqual([
      "economic",
      "social_cultural",
      "sovereignty",
      "institutional",
      "ecological",
    ]);
  });

  it("uses modal_score as radarValue when present", () => {
    const agg = loadFixture();
    agg.positioning.economic.modal_score = -2;
    agg.positioning.economic.consensus_interval = [-3, -1];
    const axis = deriveRadarShape(agg.positioning).axes.find(
      (a) => a.key === "economic",
    )!;
    expect(axis.radarValue).toBe(-2);
    expect(axis.modal).toBe(-2);
  });

  it("falls back to interval midpoint when modal is null", () => {
    const agg = loadFixture();
    agg.positioning.economic.modal_score = null;
    agg.positioning.economic.consensus_interval = [-4, 0];
    agg.positioning.economic.dissent = [
      {
        model: "m1",
        position: -4,
        reasoning: "r",
      },
      {
        model: "m2",
        position: 0,
        reasoning: "r",
      },
    ];
    const axis = deriveRadarShape(agg.positioning).axes.find(
      (a) => a.key === "economic",
    )!;
    expect(axis.modal).toBeNull();
    expect(axis.radarValue).toBe(-2); // midpoint of [-4, 0]
    expect(axis.hasDissent).toBe(true);
  });

  it("reports hasDissent=false when no dissent entries exist", () => {
    const agg = loadFixture();
    agg.positioning.economic.dissent = [];
    const axis = deriveRadarShape(agg.positioning).axes.find(
      (a) => a.key === "economic",
    )!;
    expect(axis.hasDissent).toBe(false);
  });
});
