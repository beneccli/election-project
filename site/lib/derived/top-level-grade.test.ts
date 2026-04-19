// See docs/specs/website/nextjs-architecture.md §3.1
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AggregatedOutputSchema, type AggregatedOutput } from "../schema";
import { deriveTopLevelGrade } from "./top-level-grade";
import { DIMENSION_KEYS, type DimensionKey } from "./keys";

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

function aggWithGrades(
  grades: Record<DimensionKey, "A" | "B" | "C" | "D" | "F" | "NOT_ADDRESSED">,
  summaryAgreement: number,
): AggregatedOutput {
  const base = loadFixture();
  for (const k of DIMENSION_KEYS) {
    base.dimensions[k].grade.consensus = grades[k];
  }
  base.summary_agreement = summaryAgreement;
  return base;
}

describe("deriveTopLevelGrade", () => {
  it("computes modal + null modifier on test-omega", () => {
    const g = deriveTopLevelGrade(loadFixture());
    expect(["A", "B", "C", "D", "F"]).toContain(g.letter);
    expect([null, "+", "-"]).toContain(g.modifier);
  });

  it("breaks two-way ties to the lower letter", () => {
    // Two B's, two C's, one A → B and C both 2x → lower (C).
    const g = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "A",
          social_demographic: "B",
          security_sovereignty: "B",
          institutional_democratic: "C",
          environmental_long_term: "C",
        },
        0.65,
      ),
    );
    expect(g.letter).toBe("C");
    expect(g.modifier).toBeNull();
  });

  it("treats NOT_ADDRESSED as F for modal computation", () => {
    const g = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "NOT_ADDRESSED",
          social_demographic: "NOT_ADDRESSED",
          security_sovereignty: "NOT_ADDRESSED",
          institutional_democratic: "C",
          environmental_long_term: "C",
        },
        0.65,
      ),
    );
    expect(g.letter).toBe("F");
  });

  it("applies + modifier at summary_agreement >= 0.80", () => {
    const atThreshold = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "B",
          social_demographic: "B",
          security_sovereignty: "B",
          institutional_democratic: "B",
          environmental_long_term: "B",
        },
        0.8,
      ),
    );
    expect(atThreshold.modifier).toBe("+");

    const below = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "B",
          social_demographic: "B",
          security_sovereignty: "B",
          institutional_democratic: "B",
          environmental_long_term: "B",
        },
        0.79,
      ),
    );
    expect(below.modifier).toBeNull();
  });

  it("applies - modifier at summary_agreement < 0.50", () => {
    const below = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "C",
          social_demographic: "C",
          security_sovereignty: "C",
          institutional_democratic: "C",
          environmental_long_term: "C",
        },
        0.49,
      ),
    );
    expect(below.modifier).toBe("-");

    const atThreshold = deriveTopLevelGrade(
      aggWithGrades(
        {
          economic_fiscal: "C",
          social_demographic: "C",
          security_sovereignty: "C",
          institutional_democratic: "C",
          environmental_long_term: "C",
        },
        0.5,
      ),
    );
    expect(atThreshold.modifier).toBeNull();
  });
});
