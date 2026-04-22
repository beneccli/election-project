/**
 * Prompt-contract tests for prompts/aggregate-analyses.md.
 *
 * These tests defend the aggregation prompt against silent editorial drift.
 * They mirror scripts/lib/prompt-contract.test.ts for analyze-candidate.md
 * and add assertions specific to aggregation:
 * - The "no cardinal aggregated score" rule is stated explicitly.
 * - Arithmetic-mean averaging of positioning is forbidden explicitly.
 * - Dissent preservation is structural (supported_by / dissenters), not
 *   prose hedging.
 * - Claims unsupported by sources.md are flagged, not published.
 * - Committed SHA256 snapshot matches the file's current hash.
 *
 * See docs/specs/analysis/aggregation.md (Stable).
 * See docs/specs/analysis/editorial-principles.md (Stable).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

import { hashString } from "./hash";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PROMPT_PATH = join(REPO_ROOT, "prompts", "aggregate-analyses.md");
const HASH_PATH = join(REPO_ROOT, "prompts", "aggregate-analyses.sha256.txt");

const REQUIRED_HEADINGS = [
  "Role and context",
  "Operational principles",
  "Inputs",
  "Aggregation rules",
  "Dissent vs consensus",
  "Intergenerational",
  "Banned language",
  "Output format",
];

const BANNED_CANDIDATE_NAMES = [
  "Le Pen",
  "Zemmour",
  "Bardella",
  "Attal",
  "Philippe",
  "Ciotti",
  "Bellamy",
  "Fillon",
  "Glucksmann",
];

// Moral verbs that must not appear in instruction position. The aggregator
// prompt describes the banned-vocabulary rule abstractly (pointing to the
// editorial-principles spec) rather than spelling out each verb, so these
// words must not appear anywhere in the file.
const BANNED_MORAL_VERBS = [
  "sacrifice",
  "steal",
  "betray",
  "rescue",
  "crushing",
];

let prompt: string;

beforeAll(async () => {
  prompt = await readFile(PROMPT_PATH, "utf8");
});

describe("prompts/aggregate-analyses.md — structural contracts", () => {
  test("all required section headings present", () => {
    for (const heading of REQUIRED_HEADINGS) {
      expect(prompt, `missing heading: ${heading}`).toContain(heading);
    }
  });

  test("frontmatter declares version 1.x and status: stable", () => {
    const match = prompt.match(/^---\n([\s\S]*?)\n---/);
    expect(match, "YAML frontmatter missing").not.toBeNull();
    const front = match![1];
    expect(front).toMatch(/^version:\s*["']?1(\.[\d.]+)?["']?\s*$/m);
    expect(front).toMatch(/^status:\s*stable\s*$/m);
  });

  test("ends with exactly one trailing newline", () => {
    expect(prompt.endsWith("\n")).toBe(true);
    expect(prompt.endsWith("\n\n")).toBe(false);
  });

  test("no banned 2027 candidate names anywhere", () => {
    // The aggregator prompt is generic across all candidates; no 2027
    // candidate name should appear. Historical positioning anchors
    // (Hollande, Macron 2017, Mélenchon 2022) may appear only as reference
    // anchors — those names are not in BANNED_CANDIDATE_NAMES below because
    // they are legitimate fixed anchors. Names of potential 2027 candidates
    // are forbidden.
    for (const name of BANNED_CANDIDATE_NAMES) {
      expect(
        prompt.includes(name),
        `banned candidate name "${name}" appears in aggregator prompt`,
      ).toBe(false);
    }
  });

  test("no banned moral/advocacy verbs anywhere", () => {
    const lower = prompt.toLowerCase();
    for (const verb of BANNED_MORAL_VERBS) {
      const re = new RegExp(`\\b${verb}\\b`, "i");
      expect(
        re.test(lower),
        `banned moral verb "${verb}" appears in aggregator prompt`,
      ).toBe(false);
    }
  });
});

describe("prompts/aggregate-analyses.md — editorial guardrails", () => {
  test("forbids emitting a positioning `score` field", () => {
    // The prompt must carry an explicit prohibition against producing a
    // cardinal `score` field under positioning. Wording-flexible check:
    // we require either "no `score` field" or "do not emit a `score`"
    // or "no ... score ... field" style language to appear.
    const patterns = [
      /no\s+`?score`?\s+field/i,
      /no\s+aggregated\s+`?score`?\s+field/i,
      /do\s+not\s+emit\s+(?:a\s+)?`?score`?\s+field/i,
      /do\s+not\s+produce\s+aggregated\s+`?score`?\s+fields?/i,
    ];
    expect(
      patterns.some((re) => re.test(prompt)),
      "aggregator prompt must explicitly forbid emitting a positioning `score` field",
    ).toBe(true);
  });

  test("forbids arithmetic-mean averaging of positioning", () => {
    const patterns = [
      /do\s+not\s+(?:compute\s+)?(?:arithmetic\s+)?mean/i,
      /never\s+(?:arithmetic-?)?average/i,
      /no\s+arithmetic\s+mean/i,
    ];
    expect(
      patterns.some((re) => re.test(prompt)),
      "aggregator prompt must explicitly forbid arithmetic-mean averaging of positioning",
    ).toBe(true);
  });

  test("flags (not publishes) claims unsupported by sources.md", () => {
    // Two conditions must hold: the prompt mentions flagged_for_review as
    // the destination for unsupported claims, AND mentions sources.md as
    // the ground-truth check.
    expect(prompt).toMatch(/flagged_for_review/);
    expect(prompt).toMatch(/sources\.md/);
    // And the routing instruction must be present in some form.
    const routingPatterns = [
      /route[sd]?\s+[^.]*flagged_for_review/i,
      /not\s+[^.]*(?:publish|merge)/i,
      /flag[^.]*(?:not\s+publish|not\s+merge|do\s+not\s+publish)/i,
    ];
    expect(
      routingPatterns.some((re) => re.test(prompt)),
      "aggregator prompt must route unsupported claims to flagged_for_review (not publish)",
    ).toBe(true);
  });

  test("correlated-hallucination rule explicitly stated", () => {
    // Unanimity across models must not override sources.md. The prompt
    // must say so — any clause linking "all models" or "unanimity" to the
    // flagging rule satisfies this.
    const patterns = [
      /correlated\s+hallucination/i,
      /unanimity\s+[^.]*(?:not\s+override|does\s+not\s+override)/i,
      /all\s+(?:N\s+)?models\s+[^.]*(?:flag|still\s+flag)/i,
    ];
    expect(
      patterns.some((re) => re.test(prompt)),
      "aggregator prompt must state the correlated-hallucination rule (unanimity does not override sources.md)",
    ).toBe(true);
  });

  test("dissent is preserved structurally, not in prose", () => {
    // The "Dissent vs consensus" section exists (checked in structural
    // tests above) and references the structural fields that carry dissent.
    expect(prompt).toMatch(/supported_by/);
    expect(prompt).toMatch(/dissenters/);
    // At least one passage must describe dissent as structural, not as
    // prose hedging.
    const patterns = [
      /dissent\s+(?:lives\s+in|is\s+recorded\s+in|preserved\s+by)\s+(?:structured\s+)?fields?/i,
      /not\s+in\s+(?:hedging\s+)?prose/i,
      /structural,\s+not\s+prose/i,
    ];
    expect(
      patterns.some((re) => re.test(prompt)),
      "aggregator prompt must describe dissent preservation as structural, not prose hedging",
    ).toBe(true);
  });
});

describe("prompts/aggregate-analyses.md — hash pinning", () => {
  test("hashing the prompt is deterministic", () => {
    const h1 = hashString(prompt);
    const h2 = hashString(prompt);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  test("committed SHA256 snapshot matches current prompt hash", async () => {
    const snapshot = (await readFile(HASH_PATH, "utf8")).trim();
    const actual = hashString(prompt);
    expect(
      actual,
      `prompt hash drift — update prompts/aggregate-analyses.sha256.txt to ${actual}`,
    ).toBe(snapshot);
  });
});

// ---------------------------------------------------------------------------
// Schema v1.2 — overall_spectrum aggregation (M_PoliticalSpectrum)
// See docs/specs/analysis/political-spectrum-label.md §6.2.
// ---------------------------------------------------------------------------

describe("prompts/aggregate-analyses.md — overall_spectrum contract", () => {
  test("§4.3.bis heading is present", () => {
    expect(prompt).toMatch(/### 4\.3\.bis Overall spectrum label/);
  });

  test("overall_spectrum aggregation references modal_label and label_distribution", () => {
    expect(prompt).toContain("overall_spectrum");
    expect(prompt).toContain("modal_label");
    expect(prompt).toContain("label_distribution");
  });

  test("'never promote a label no model emitted' rule is stated", () => {
    expect(prompt).toMatch(/never promote a label no model emitted/i);
  });

  test("§4.3 never-average clause extends to overall_spectrum", () => {
    // The §4.3 closing paragraph must tie the numeric-prohibition to the
    // categorical spectrum label too, not just the five axes.
    const closingMatch = prompt.match(
      /arithmetic mean or median[\s\S]*?overall_spectrum/,
    );
    expect(
      closingMatch,
      "the §4.3 never-average clause must name overall_spectrum explicitly",
    ).not.toBeNull();
  });

  test("agreement_map.positioning_consensus.overall_spectrum is documented", () => {
    // The JSON skeleton in §8 must list the overall_spectrum entry inside
    // positioning_consensus so the aggregator emits it.
    expect(prompt).toMatch(
      /positioning_consensus:[\s\S]*overall_spectrum:[\s\S]*modal_label/,
    );
  });

  test("inclassable is treated as a regular enum value, not a fallback", () => {
    // The prompt must explicitly state that inclassable is a regular enum
    // value and that ties produce modal_label = null, not inclassable.
    expect(prompt).toMatch(/inclassable/);
    const regularValueClauses = [
      /inclassable[\s\S]{0,40}regular\s+enum\s+value/i,
      /not[\s\S]{0,10}a\s+fallback\s+for\s+tied\s+modes/i,
    ];
    expect(
      regularValueClauses.every((re) => re.test(prompt)),
      "prompt must explicitly state inclassable is a regular enum value and not a tied-mode fallback",
    ).toBe(true);
  });
});