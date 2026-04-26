// See docs/specs/website/comparison-page.md §4.1
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AggregatedOutputSchema, type AggregatedOutput } from "../schema";
import {
  deriveComparisonProjection,
  HORIZON_ROW_KEYS,
  RISK_CATEGORY_KEYS,
  RISK_LEVEL_ORDER,
  type ComparisonProjection,
} from "./comparison-projection";
import { AXIS_KEYS, DIMENSION_KEYS } from "./keys";
import { buildComparisonEntries } from "../comparison-projections";
import type {
  CandidateBundle,
  CandidateIndexEntry,
} from "../candidates";
import {
  CandidateMetadataSchema,
  VersionMetadataSchema,
  type CandidateMetadata,
  type VersionMetadata,
} from "../schema";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OMEGA_ROOT = path.resolve(
  HERE,
  "..",
  "..",
  "..",
  "candidates",
  "test-omega",
  "current",
);

function loadOmegaBundle(): CandidateBundle {
  const aggregated = AggregatedOutputSchema.parse(
    JSON.parse(fs.readFileSync(path.join(OMEGA_ROOT, "aggregated.json"), "utf8")),
  );
  const meta: CandidateMetadata = CandidateMetadataSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.resolve(OMEGA_ROOT, "..", "metadata.json"),
        "utf8",
      ),
    ),
  );
  const versionMeta: VersionMetadata = VersionMetadataSchema.parse(
    JSON.parse(fs.readFileSync(path.join(OMEGA_ROOT, "metadata.json"), "utf8")),
  );
  return {
    meta,
    versionMeta,
    aggregated,
    rawSummaries: [],
    translation: { lang: "fr", status: "native_fr" },
  };
}

function cloneAgg(agg: AggregatedOutput): AggregatedOutput {
  return JSON.parse(JSON.stringify(agg)) as AggregatedOutput;
}

describe("deriveComparisonProjection", () => {
  const bundle = loadOmegaBundle();

  it("passes through metadata identity fields", () => {
    const proj = deriveComparisonProjection(bundle);
    expect(proj.id).toBe(bundle.meta.id);
    expect(proj.displayName).toBe(bundle.meta.display_name);
    expect(proj.party).toBe(bundle.meta.party);
    expect(proj.updatedAt).toBe(bundle.meta.updated);
    expect(proj.isFictional).toBe(true);
    expect(proj.analyzable).toBe(true);
  });

  it("projects positioning from modal_score for each axis, in order", () => {
    const proj = deriveComparisonProjection(bundle);
    expect(proj.positioning).toHaveLength(AXIS_KEYS.length);
    for (let i = 0; i < AXIS_KEYS.length; i++) {
      const axis = AXIS_KEYS[i];
      expect(proj.positioning[i]).toBe(
        bundle.aggregated.positioning[axis].modal_score,
      );
    }
  });

  it("projects consensus grade for each dimension", () => {
    const proj = deriveComparisonProjection(bundle);
    for (const dim of DIMENSION_KEYS) {
      expect(proj.dimGrades[dim]).toBe(
        bundle.aggregated.dimensions[dim].grade.consensus,
      );
    }
  });

  it("maps risk modal_level to RISK_LEVEL_ORDER index, -1 for null", () => {
    const proj = deriveComparisonProjection(bundle);
    for (const dim of DIMENSION_KEYS) {
      const row = proj.risks[dim];
      expect(row).toHaveLength(RISK_CATEGORY_KEYS.length);
      for (let i = 0; i < RISK_CATEGORY_KEYS.length; i++) {
        const cat = RISK_CATEGORY_KEYS[i];
        const level =
          bundle.aggregated.dimensions[dim].risk_profile[cat].modal_level;
        const expected =
          level === null ? -1 : RISK_LEVEL_ORDER.indexOf(level);
        expect(row[i]).toBe(expected);
      }
    }
  });

  it("projects intergen only from the h_2038_2047 cell of each horizon row", () => {
    const proj = deriveComparisonProjection(bundle);
    for (const matrixRow of bundle.aggregated.intergenerational.horizon_matrix) {
      expect(proj.intergen[matrixRow.row as (typeof HORIZON_ROW_KEYS)[number]]).toBe(
        matrixRow.cells.h_2038_2047.modal_score,
      );
    }
  });

  it("is insensitive to h_2027_2030 (no cross-horizon averaging)", () => {
    const baseline = deriveComparisonProjection(bundle);
    const mutated = cloneAgg(bundle.aggregated);
    for (const row of mutated.intergenerational.horizon_matrix) {
      row.cells.h_2027_2030.modal_score = -3;
    }
    const after = deriveComparisonProjection({
      ...bundle,
      aggregated: mutated,
    });
    expect(after.intergen).toStrictEqual(baseline.intergen);
  });

  it("is insensitive to h_2031_2037 (no cross-horizon averaging)", () => {
    const baseline = deriveComparisonProjection(bundle);
    const mutated = cloneAgg(bundle.aggregated);
    for (const row of mutated.intergenerational.horizon_matrix) {
      row.cells.h_2031_2037.modal_score = 3;
    }
    const after = deriveComparisonProjection({
      ...bundle,
      aggregated: mutated,
    });
    expect(after.intergen).toStrictEqual(baseline.intergen);
  });

  it("passes null modal_score through unchanged", () => {
    const mutated = cloneAgg(bundle.aggregated);
    mutated.positioning[AXIS_KEYS[0]].modal_score = null;
    const proj = deriveComparisonProjection({
      ...bundle,
      aggregated: mutated,
    });
    expect(proj.positioning[0]).toBeNull();
  });

  it("derives partyShort from party initials", () => {
    const customBundle: CandidateBundle = {
      ...bundle,
      meta: { ...bundle.meta, party: "Mouvement Écologique Solidaire" },
    };
    const proj = deriveComparisonProjection(customBundle);
    expect(proj.partyShort).toBe("MÉS");
  });

  it("projects the spectrum label and status from overall_spectrum", () => {
    const proj = deriveComparisonProjection(bundle);
    expect(proj.spectrumStatus).toBe("present");
    expect(proj.spectrumLabelDisplay).toBe("Gauche");
  });

  it("projects status=absent with null label when overall_spectrum is missing", () => {
    const agg = cloneAgg(bundle.aggregated);
    delete (agg.positioning as { overall_spectrum?: unknown })
      .overall_spectrum;
    const proj = deriveComparisonProjection({ ...bundle, aggregated: agg });
    expect(proj.spectrumStatus).toBe("absent");
    expect(proj.spectrumLabelDisplay).toBeNull();
  });
});

describe("comparison-projection source (editorial guardrail)", () => {
  it("does not compute any mean/average/sum across fields", () => {
    const src = fs.readFileSync(
      path.resolve(HERE, "comparison-projection.ts"),
      "utf8",
    );
    // The projection must collapse ordinal modals one-to-one; any
    // `mean(`, `average(`, `.reduce((a,b)=>a+b`, or `sum(` would be a
    // red flag.
    const forbidden = [
      /\bmean\s*\(/,
      /\baverage\s*\(/,
      /\bsum\s*\(/,
      /\.reduce\s*\(/,
    ];
    for (const pat of forbidden) {
      expect(src).not.toMatch(pat);
    }
  });
});

describe("buildComparisonEntries", () => {
  const bundle = loadOmegaBundle();

  const rows: CandidateIndexEntry[] = [
    {
      id: "test-omega",
      displayName: "Omega Synthétique",
      party: "Parti Test",
      partyId: "test",
      isFictional: true,
    availableLocales: ["fr"],
      versionDate: "2027-11-01",
      updatedAt: bundle.meta.updated,
    },
    {
      id: "test-broken",
      displayName: "Broken Candidate",
      party: "Parti Test",
      partyId: "test",
      isFictional: true,
    availableLocales: ["fr"],
      versionDate: "2027-11-01",
      updatedAt: bundle.meta.updated,
    },
  ];

  it("yields analyzable projection for loadable candidates", () => {
    const entries = buildComparisonEntries(rows.slice(0, 1), () => bundle);
    expect(entries).toHaveLength(1);
    const entry = entries[0] as ComparisonProjection;
    expect(entry.analyzable).toBe(true);
    expect(entry.id).toBe("test-omega");
  });

  it("marks failing-to-load candidates as non-analyzable without throwing", () => {
    const entries = buildComparisonEntries(rows, (id) => {
      if (id === "test-broken") {
        throw new Error("schema invalid");
      }
      return bundle;
    });
    expect(entries).toHaveLength(2);
    expect(entries[0].analyzable).toBe(true);
    const broken = entries[1];
    expect(broken.analyzable).toBe(false);
    if (!broken.analyzable) {
      expect(broken.id).toBe("test-broken");
      expect(broken.reason).toContain("schema invalid");
    }
  });
});
