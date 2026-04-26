/**
 * Unit tests for translation parity validator.
 *
 * Spec: docs/specs/website/i18n.md §2.4
 * Task: tasks/archive/M_I18n/0121-translation-parity-validator.md
 */
import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { buildValidAggregatedOutput } from "./lib/fixtures/aggregated-output/builder";
import { AggregatedOutputSchema } from "./lib/schema";
import { ParityError, checkParity } from "./validate-translation";
import {
  TRANSLATABLE_PATHS,
  isTranslatablePath,
  matchesPattern,
} from "./lib/translatable-paths";

/** Deep-clone via JSON. Sufficient for our pure-data fixtures. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("translatable-paths allowlist", () => {
  test("matchesPattern handles `*` (array index) and `<key>` (object key)", () => {
    expect(matchesPattern("dimensions.economy.summary", "dimensions.<dim>.summary"))
      .toBe(true);
    expect(matchesPattern("dimensions.0.summary", "dimensions.<dim>.summary"))
      .toBe(false); // <dim> rejects numeric segments
    expect(
      matchesPattern(
        "dimensions.economy.problems_addressed.0.summary",
        "dimensions.<dim>.problems_addressed.*.summary",
      ),
    ).toBe(true);
    expect(
      matchesPattern(
        "dimensions.economy.problems_addressed.foo.summary",
        "dimensions.<dim>.problems_addressed.*.summary",
      ),
    ).toBe(false); // * rejects non-numeric
  });

  test("isTranslatablePath returns true for allowlisted paths", () => {
    expect(isTranslatablePath("summary")).toBe(true);
    expect(isTranslatablePath("dimensions.economy.summary")).toBe(true);
    expect(isTranslatablePath("counterfactual.reasoning")).toBe(true);
    expect(isTranslatablePath("counterfactual.status_quo_trajectory")).toBe(true);
  });

  test("isTranslatablePath returns false for non-allowlisted paths", () => {
    expect(isTranslatablePath("schema_version")).toBe(false);
    expect(isTranslatablePath("dimensions.economy.grade.consensus")).toBe(false);
    expect(
      isTranslatablePath("agreement_map.high_confidence.0.claim_id"),
    ).toBe(false);
    expect(
      isTranslatablePath("dimensions.economy.problems_addressed.0.strength"),
    ).toBe(false);
  });

  test("allowlist is non-empty and well-formed", () => {
    expect(TRANSLATABLE_PATHS.length).toBeGreaterThan(0);
    for (const p of TRANSLATABLE_PATHS) {
      expect(p).toMatch(/^[a-z_][a-z_<>*0-9.]*$/i);
    }
  });
});

describe("checkParity — happy paths", () => {
  test("identical FR and translation pass (FR-as-EN)", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr);
    expect(() => checkParity(fr, tr)).not.toThrow();
  });

  test("modifying only allowlisted prose strings passes", () => {
    const fr = buildValidAggregatedOutput();
    // Re-validate so we know our fixture is shape-correct first.
    AggregatedOutputSchema.parse(fr);
    const tr = clone(fr);
    tr.summary = "[EN] " + tr.summary;
    tr.dimensions.economic_fiscal.summary = "[EN] dimension prose";
    tr.dimensions.economic_fiscal.headline.text = "[EN] headline";
    tr.dimensions.economic_fiscal.problems_addressed[0].problem =
      "[EN] problem statement";
    tr.dimensions.economic_fiscal.problems_addressed[0].approach =
      "[EN] approach prose";
    tr.dimensions.economic_fiscal.problems_addressed[0].reasoning =
      "[EN] reasoning prose";
    tr.positioning.economic.anchor_narrative = "[EN] axis narrative";
    expect(() => checkParity(fr, tr)).not.toThrow();
  });
});

describe("checkParity — failure modes", () => {
  test("modified non-allowlisted string is rejected", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr);
    // grade.consensus is a non-translatable identifier.
    tr.dimensions.economic_fiscal.grade.consensus = "A";
    let caught: unknown;
    try {
      checkParity(fr, tr);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParityError);
    const issues = (caught as ParityError).issues;
    expect(
      issues.some(
        (i) => i.path === "dimensions.economic_fiscal.grade.consensus",
      ),
    ).toBe(true);
    expect(issues.every((i) => i.kind === "value-mismatch")).toBe(true);
  });

  test("modified numeric value is rejected", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr);
    tr.positioning.economic.modal_score = 0;
    let caught: unknown;
    try {
      checkParity(fr, tr);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParityError);
    const issues = (caught as ParityError).issues;
    expect(
      issues.some((i) => i.path === "positioning.economic.modal_score"),
    ).toBe(true);
  });

  test("modified array length is rejected (even on translatable arrays)", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr);
    // problems_addressed itself is not in the allowlist; only its
    // children's `.summary` field is. But array length is checked
    // structurally regardless.
    tr.dimensions.economic_fiscal.problems_addressed.push(
      clone(fr.dimensions.economic_fiscal.problems_addressed[0]),
    );
    let caught: unknown;
    try {
      checkParity(fr, tr);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParityError);
    const issues = (caught as ParityError).issues;
    expect(
      issues.some(
        (i) =>
          i.kind === "array-length-mismatch" &&
          i.path === "dimensions.economic_fiscal.problems_addressed",
      ),
    ).toBe(true);
  });

  test("missing key is rejected", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr) as Record<string, unknown>;
    delete (tr as { summary?: unknown }).summary;
    let caught: unknown;
    try {
      checkParity(fr, tr);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParityError);
    const issues = (caught as ParityError).issues;
    expect(issues.some((i) => i.kind === "missing-key" && i.path === "summary"))
      .toBe(true);
  });

  test("extra key is rejected", () => {
    const fr = buildValidAggregatedOutput();
    const tr = clone(fr) as Record<string, unknown>;
    tr.extraneous_field = "[EN] should not be here";
    let caught: unknown;
    try {
      checkParity(fr, tr);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ParityError);
    const issues = (caught as ParityError).issues;
    expect(
      issues.some(
        (i) => i.kind === "extra-key" && i.path === "extraneous_field",
      ),
    ).toBe(true);
  });
});

describe("VersionMetadataSchema additive `translations` field", () => {
  test("existing metadata without translations still parses", async () => {
    const { VersionMetadataSchema } = await import("./lib/schema");
    const minimal = {
      candidate_id: "test-candidate",
      version_date: "2026-04-25",
      schema_version: "1.0",
    };
    expect(() => VersionMetadataSchema.parse(minimal)).not.toThrow();
  });

  test("translations block accepts a valid en entry", async () => {
    const { VersionMetadataSchema } = await import("./lib/schema");
    const withTr = {
      candidate_id: "test-candidate",
      version_date: "2026-04-25",
      schema_version: "1.0",
      translations: {
        en: {
          prompt_file: "prompts/translate-aggregated.md",
          prompt_sha256:
            "0".repeat(64),
          prompt_version: "1.0",
          execution_mode: "manual-webchat",
          attested_model_version: "claude-opus-4-7",
          ingested_at: "2026-04-25T12:34:56Z",
          human_review_completed: false,
        },
      },
    };
    expect(() => VersionMetadataSchema.parse(withTr)).not.toThrow();
  });

  test("translations block rejects non-ISO-639-1 keys and underscored execution_mode", async () => {
    const { VersionMetadataSchema } = await import("./lib/schema");
    const badKey = {
      candidate_id: "test-candidate",
      version_date: "2026-04-25",
      schema_version: "1.0",
      translations: {
        ENG: {
          prompt_file: "prompts/translate-aggregated.md",
          prompt_sha256: "0".repeat(64),
          prompt_version: "1.0",
          execution_mode: "manual-webchat",
          attested_model_version: "claude-opus-4-7",
          ingested_at: "2026-04-25T12:34:56Z",
          human_review_completed: false,
        },
      },
    };
    expect(() => VersionMetadataSchema.parse(badKey)).toThrow(ZodError);

    const badMode = {
      candidate_id: "test-candidate",
      version_date: "2026-04-25",
      schema_version: "1.0",
      translations: {
        en: {
          prompt_file: "prompts/translate-aggregated.md",
          prompt_sha256: "0".repeat(64),
          prompt_version: "1.0",
          execution_mode: "manual_webchat", // wrong: spec uses hyphens
          attested_model_version: "claude-opus-4-7",
          ingested_at: "2026-04-25T12:34:56Z",
          human_review_completed: false,
        },
      },
    };
    expect(() => VersionMetadataSchema.parse(badMode)).toThrow(ZodError);
  });
});
