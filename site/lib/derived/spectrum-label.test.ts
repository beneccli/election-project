// See docs/specs/analysis/political-spectrum-label.md §8.1
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AggregatedOutputSchema, type AggregatedOutput } from "../schema";
import { deriveSpectrumLabel } from "./spectrum-label";

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

describe("deriveSpectrumLabel", () => {
  it("returns status=present with localized label when modal_label is a regular value", () => {
    const agg = loadFixture();
    const d = deriveSpectrumLabel(agg, "fr");
    expect(d.status).toBe("present");
    expect(d.label).toBe("gauche");
    expect(d.displayText).toBe("Gauche");
    expect(d.tooltipLines.length).toBe(
      agg.positioning.overall_spectrum!.per_model.length,
    );
  });

  it("localizes the display label in English", () => {
    const d = deriveSpectrumLabel(loadFixture(), "en");
    expect(d.displayText).toBe("Left");
  });

  it("returns status=split with 'Positionnement partagé' when modal_label is null", () => {
    const agg = loadFixture();
    agg.positioning.overall_spectrum!.modal_label = null;
    const d = deriveSpectrumLabel(agg, "fr");
    expect(d.status).toBe("split");
    expect(d.label).toBeNull();
    expect(d.displayText).toBe("Positionnement partagé");
  });

  it("returns status=inclassable with 'Hors spectre' when modal_label is inclassable", () => {
    const agg = loadFixture();
    agg.positioning.overall_spectrum!.modal_label = "inclassable";
    const d = deriveSpectrumLabel(agg, "fr");
    expect(d.status).toBe("inclassable");
    expect(d.label).toBe("inclassable");
    expect(d.displayText).toBe("Hors spectre");
  });

  it("returns status=absent with null displayText when the field is missing", () => {
    const agg = loadFixture();
    delete (agg.positioning as { overall_spectrum?: unknown })
      .overall_spectrum;
    const d = deriveSpectrumLabel(agg, "fr");
    expect(d.status).toBe("absent");
    expect(d.label).toBeNull();
    expect(d.displayText).toBeNull();
    expect(d.tooltipLines).toEqual([]);
  });

  it("builds tooltip lines from per_model entries", () => {
    const d = deriveSpectrumLabel(loadFixture(), "fr");
    for (const line of d.tooltipLines) {
      expect(line).toMatch(/: /);
    }
  });
});
