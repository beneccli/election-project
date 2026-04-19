/**
 * Round-trip regression tests for on-disk analysis output fixtures.
 *
 * See scripts/lib/fixtures/analysis-output/README.md.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { AnalysisOutputSchema } from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "fixtures", "analysis-output");

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, name), "utf8"));
}

describe("valid fixtures parse", () => {
  const cases = [
    "valid-full.json",
    "valid-minimal.json",
    "valid-not-addressed.json",
  ];
  for (const name of cases) {
    test(`${name} is accepted by AnalysisOutputSchema`, () => {
      expect(() => AnalysisOutputSchema.parse(readFixture(name))).not.toThrow();
    });
  }
});

describe("invalid fixtures are rejected with expected issue path", () => {
  const cases: Array<{ file: string; pathMatches: RegExp }> = [
    {
      file: "invalid-missing-source-refs.json",
      pathMatches: /problems_addressed/,
    },
    {
      file: "invalid-positioning-out-of-range.json",
      pathMatches: /positioning\.economic\.score/,
    },
    {
      file: "invalid-positioning-non-integer.json",
      pathMatches: /positioning\.economic\.score/,
    },
    {
      file: "invalid-grade-enum.json",
      pathMatches: /dimensions\.economic_fiscal\.grade/,
    },
    {
      file: "invalid-confidence-out-of-range.json",
      pathMatches: /confidence_self_assessment/,
    },
  ];

  for (const { file, pathMatches } of cases) {
    test(`${file} is rejected and issue path matches ${pathMatches}`, () => {
      let caught: unknown;
      try {
        AnalysisOutputSchema.parse(readFixture(file));
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(ZodError);
      const zerr = caught as ZodError;
      const paths = zerr.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => pathMatches.test(p))).toBe(true);
    });
  }
});
