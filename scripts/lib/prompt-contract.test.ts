/**
 * Prompt-contract tests for prompts/analyze-candidate.md.
 *
 * These tests defend editorial principles against silent drift:
 * - Required section headings are present.
 * - Frontmatter declares a pinned version and `status: stable`.
 * - No candidate names from the banned list appear outside the positioning
 *   anchors section.
 * - No advocacy/moral verbs appear.
 * - File ends with exactly one trailing newline (hash stability).
 * - The committed SHA256 snapshot matches the file's current hash. This forces
 *   every prompt edit to also update the snapshot, making the change visible
 *   in code review.
 *
 * See docs/specs/analysis/analysis-prompt.md (Stable).
 * See docs/specs/analysis/editorial-principles.md (Stable).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

import { hashString } from "./hash";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PROMPT_PATH = join(REPO_ROOT, "prompts", "analyze-candidate.md");
const HASH_PATH = join(REPO_ROOT, "prompts", "analyze-candidate.sha256.txt");

const REQUIRED_HEADINGS = [
  "Role and context",
  "Operational principles",
  "Source material",
  "Dimensions to analyze",
  "Required output structure",
  "Evidence citations",
  "Self-confidence scores",
  "Adversarial pass",
  "Political positioning",
];

const BANNED_CANDIDATE_NAMES = [
  "Macron",
  "Le Pen",
  "Mélenchon",
  "Zemmour",
  "Bardella",
  "Attal",
  "Philippe",
  "Ciotti",
  "Bellamy",
  "Hollande",
  "Fillon",
  "Glucksmann",
];

const BANNED_MORAL_VERBS = [
  "sacrifice",
  "steal",
  "betray",
  "rescue",
  "crushing",
  "generous",
];

let prompt: string;

beforeAll(async () => {
  prompt = await readFile(PROMPT_PATH, "utf8");
});

describe("prompts/analyze-candidate.md — structural contracts", () => {
  test("all required section headings present", () => {
    for (const heading of REQUIRED_HEADINGS) {
      expect(prompt, `missing heading: ${heading}`).toContain(heading);
    }
  });

  test("frontmatter declares version and status: stable", () => {
    const match = prompt.match(/^---\n([\s\S]*?)\n---/);
    expect(match, "YAML frontmatter missing").not.toBeNull();
    const front = match![1];
    expect(front).toMatch(/^version:\s*["']?[\d.]+["']?\s*$/m);
    expect(front).toMatch(/^status:\s*stable\s*$/m);
  });

  test("ends with exactly one trailing newline", () => {
    expect(prompt.endsWith("\n")).toBe(true);
    expect(prompt.endsWith("\n\n")).toBe(false);
  });

  test("no banned candidate names outside the positioning section", () => {
    // The positioning section (## 9. Political positioning) intentionally
    // references candidate names as fixed anchors. Everything before it must
    // remain name-free.
    const positioningIdx = prompt.indexOf("## 9. Political positioning");
    expect(positioningIdx, "positioning section not found").toBeGreaterThan(0);
    const beforePositioning = prompt.slice(0, positioningIdx);

    for (const name of BANNED_CANDIDATE_NAMES) {
      expect(
        beforePositioning.includes(name),
        `banned candidate name "${name}" appears outside positioning section`,
      ).toBe(false);
    }
  });

  test("no banned moral/advocacy verbs anywhere", () => {
    const lower = prompt.toLowerCase();
    for (const verb of BANNED_MORAL_VERBS) {
      const re = new RegExp(`\\b${verb}\\b`, "i");
      expect(
        re.test(lower),
        `banned moral verb "${verb}" appears in prompt`,
      ).toBe(false);
    }
  });

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
      `prompt hash drift — update prompts/analyze-candidate.sha256.txt to ${actual}`,
    ).toBe(snapshot);
  });
});

// ---------------------------------------------------------------------------
// Schema v1.2 — overall_spectrum (M_PoliticalSpectrum)
// See docs/specs/analysis/political-spectrum-label.md §6.1.
// ---------------------------------------------------------------------------

describe("prompts/analyze-candidate.md — overall_spectrum contract", () => {
  const SPECTRUM_ENUM_VALUES = [
    "extreme_gauche",
    "gauche",
    "centre_gauche",
    "centre",
    "centre_droit",
    "droite",
    "extreme_droite",
    "inclassable",
  ];

  test("§9.6 heading is present", () => {
    expect(prompt).toMatch(/### 9\.6 Overall spectrum label/);
  });

  test("all 8 spectrum enum values are named verbatim", () => {
    for (const value of SPECTRUM_ENUM_VALUES) {
      expect(
        prompt,
        `missing spectrum enum value: ${value}`,
      ).toContain(value);
    }
  });

  test("derived_from_axes requirement is stated", () => {
    expect(prompt).toContain("derived_from_axes");
    expect(prompt).toMatch(/non-empty/i);
  });

  test("inclassable escape hatch is documented", () => {
    expect(prompt).toMatch(/inclassable/);
    expect(prompt).toMatch(/escape hatch|orthogonal/i);
  });

  test("§5 output structure references overall_spectrum", () => {
    const fiveHeadingIdx = prompt.indexOf("## 5. Required output structure");
    const sixHeadingIdx = prompt.indexOf("## 6. Evidence citations");
    expect(fiveHeadingIdx).toBeGreaterThan(0);
    expect(sixHeadingIdx).toBeGreaterThan(fiveHeadingIdx);
    const sectionFive = prompt.slice(fiveHeadingIdx, sixHeadingIdx);
    expect(sectionFive).toContain("overall_spectrum");
    expect(sectionFive).toContain("schema_version: \"1.2\"");
  });
});
