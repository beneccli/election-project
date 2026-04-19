/**
 * Round-trip regression tests for on-disk aggregated-output fixtures.
 *
 * See scripts/lib/fixtures/aggregated-output/README.md.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { AggregatedOutputSchema } from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "fixtures", "aggregated-output");

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, name), "utf8"));
}

describe("valid aggregated fixtures parse", () => {
  const cases = ["valid-full.json", "valid-single-model.json"];
  for (const name of cases) {
    test(`${name} is accepted by AggregatedOutputSchema`, () => {
      expect(() =>
        AggregatedOutputSchema.parse(readFixture(name)),
      ).not.toThrow();
    });
  }
});

describe("invalid aggregated fixtures are rejected with expected issue path", () => {
  const cases: Array<{ file: string; pathMatches: RegExp }> = [
    {
      file: "invalid-cardinal-positioning.json",
      pathMatches: /positioning\.economic/,
    },
    {
      file: "invalid-empty-supported-by.json",
      pathMatches: /problems_addressed.*supported_by/,
    },
    {
      file: "invalid-reversed-interval.json",
      pathMatches: /positioning\.economic\.consensus_interval/,
    },
  ];

  for (const { file, pathMatches } of cases) {
    test(`${file} is rejected and issue path matches ${pathMatches}`, () => {
      let caught: unknown;
      try {
        AggregatedOutputSchema.parse(readFixture(file));
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
