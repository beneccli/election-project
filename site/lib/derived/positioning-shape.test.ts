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

  it("emits a per-model shape for every model present in per_model", () => {
    const agg = loadFixture();
    const { models } = deriveRadarShape(agg.positioning);
    // test-omega has 3 source models; all must appear in the union.
    expect(models.length).toBe(3);
    const ids = models.map((m) => m.id).sort();
    expect(ids).toEqual(
      [
        "Claude Opus 4.6 High",
        "GPT-5.4 Thinking",
        "gemini-1.5-pro",
      ].sort(),
    );
    for (const m of models) {
      expect(Object.keys(m.values).sort()).toEqual(
        [
          "economic",
          "social_cultural",
          "sovereignty",
          "institutional",
          "ecological",
        ].sort(),
      );
      // Every value is an integer in [-5, +5].
      for (const v of Object.values(m.values)) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(-5);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it("backfills missing axis entries from the axis modal value", () => {
    const agg = loadFixture();
    // Remove one model from one axis and confirm the value still closes
    // the polygon using the axis's modal/midpoint.
    const originalLen = agg.positioning.economic.per_model.length;
    const droppedModel = agg.positioning.economic.per_model[0].model;
    agg.positioning.economic.per_model =
      agg.positioning.economic.per_model.slice(1);
    const shape = deriveRadarShape(agg.positioning);
    expect(agg.positioning.economic.per_model.length).toBe(originalLen - 1);
    const dropped = shape.models.find((m) => m.id === droppedModel);
    // The model still appears because it is present on the other 4 axes.
    expect(dropped).toBeDefined();
    const expected =
      agg.positioning.economic.modal_score ??
      (agg.positioning.economic.consensus_interval[0] +
        agg.positioning.economic.consensus_interval[1]) /
        2;
    expect(dropped!.values.economic).toBe(expected);
  });
});
