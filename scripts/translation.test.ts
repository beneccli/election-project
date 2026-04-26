/**
 * Tests for manual-mode translation bundler + ingest.
 *
 * Spec: docs/specs/website/i18n.md §3.
 */
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashString } from "./lib/hash";
import * as pathsMod from "./lib/paths";
import {
  buildTranslationBundle,
  prepareManualTranslation,
  renderAllowlistMarkdown,
  substitutePromptPlaceholders,
} from "./prepare-manual-translation";
import { ingestTranslation } from "./ingest-translation";
import { buildValidAggregatedOutput } from "./lib/fixtures/aggregated-output/builder";
import { TRANSLATABLE_PATHS } from "./lib/translatable-paths";
import {
  AggregatedOutputSchema,
  VersionMetadataSchema,
} from "./lib/schema";

let tmpRoot: string;
let prevCwd: string;

async function scaffoldTempProject(opts: {
  candidate: string;
  version: string;
  withAggregated?: boolean;
}): Promise<string> {
  tmpRoot = await mkdtemp(join(tmpdir(), "prepare-translation-"));

  const translatePrompt = await readFile(
    join(prevCwd, "prompts/translate-aggregated.md"),
    "utf-8",
  );
  await mkdir(join(tmpRoot, "prompts"), { recursive: true });
  await writeFile(
    join(tmpRoot, "prompts/translate-aggregated.md"),
    translatePrompt,
  );

  const tmpVersionDir = (id: string, version: string) =>
    join(tmpRoot, "candidates", id, "versions", version);

  await mkdir(tmpVersionDir(opts.candidate, opts.version), { recursive: true });

  if (opts.withAggregated) {
    const fr = buildValidAggregatedOutput();
    AggregatedOutputSchema.parse(fr);
    await writeFile(
      join(tmpVersionDir(opts.candidate, opts.version), "aggregated.json"),
      JSON.stringify(fr, null, 2) + "\n",
    );
  }

  vi.spyOn(pathsMod, "versionDir").mockImplementation(tmpVersionDir);

  process.chdir(tmpRoot);
  return tmpRoot;
}

beforeEach(() => {
  prevCwd = process.cwd();
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.chdir(prevCwd);
  if (tmpRoot) {
    await rm(tmpRoot, { recursive: true, force: true });
    tmpRoot = "";
  }
});

describe("renderAllowlistMarkdown", () => {
  test("renders every TRANSLATABLE_PATH as an inline-coded bullet", () => {
    const md = renderAllowlistMarkdown();
    for (const p of TRANSLATABLE_PATHS) {
      expect(md).toContain(`- \`${p}\``);
    }
  });
});

describe("substitutePromptPlaceholders", () => {
  test("replaces target language and allowlist marker block", () => {
    const body = [
      "# Translate to {{TARGET_LANGUAGE}}",
      "",
      "<!-- PARITY_ALLOWLIST_START -->",
      "(stale content)",
      "<!-- PARITY_ALLOWLIST_END -->",
      "",
      "Done {{TARGET_LANGUAGE}}.",
    ].join("\n");
    const out = substitutePromptPlaceholders(body, "English", "- `summary`");
    expect(out).toContain("# Translate to English");
    expect(out).toContain("Done English.");
    expect(out).toContain("- `summary`");
    expect(out).not.toContain("(stale content)");
    expect(out).not.toContain("{{TARGET_LANGUAGE}}");
  });

  test("throws when allowlist marker is missing", () => {
    expect(() =>
      substitutePromptPlaceholders("# no markers", "English", "- foo"),
    ).toThrow(/PARITY_ALLOWLIST_START/);
  });
});

describe("buildTranslationBundle", () => {
  test("includes prompt body, FR JSON, sha256, and target language", () => {
    const bundle = buildTranslationBundle({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
      targetLanguage: "English",
      promptPath: "prompts/translate-aggregated.md",
      promptBody: "# Translate to English\n\n- `summary`\n",
      promptSha256: "a".repeat(64),
      aggregatedJson: '{"schema_version":"1.2"}',
      generatedAt: "2026-04-25T12:00:00Z",
    });
    expect(bundle).toContain("Language: en (English)");
    expect(bundle).toContain("a".repeat(64));
    expect(bundle).toContain("# Translate to English");
    expect(bundle).toContain('{"schema_version":"1.2"}');
  });
});

describe("prepareManualTranslation", () => {
  test("writes bundle with substituted prompt and matching sha256", async () => {
    const root = await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });

    const result = await prepareManualTranslation({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
    });

    expect(result.targetLanguage).toBe("English");
    const bundle = await readFile(result.bundlePath, "utf-8");
    expect(bundle).toContain("Language: en (English)");
    expect(bundle).toContain("- `summary`");
    expect(bundle).not.toContain("{{TARGET_LANGUAGE}}");
    expect(bundle).not.toContain("{{ALLOWLIST}}");

    const promptText = await readFile(
      join(root, "prompts/translate-aggregated.md"),
      "utf-8",
    );
    expect(result.promptSha256).toBe(hashString(promptText));

    const readme = await readFile(
      join(
        root,
        "candidates/test-omega/versions/2026-04-25/_translation/en/README.md",
      ),
      "utf-8",
    );
    expect(readme).toContain(result.promptSha256);
  });

  test("rejects --lang fr (FR is canonical)", async () => {
    await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });
    await expect(
      prepareManualTranslation({
        candidate: "test-omega",
        version: "2026-04-25",
        lang: "fr",
      }),
    ).rejects.toThrow(/canonical/);
  });

  test("throws when aggregated.json is missing", async () => {
    await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: false,
    });
    await expect(
      prepareManualTranslation({
        candidate: "test-omega",
        version: "2026-04-25",
        lang: "en",
      }),
    ).rejects.toThrow(/aggregated\.json not found/);
  });

  test("rejects unknown language without LANGUAGE_LABELS entry", async () => {
    await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });
    await expect(
      prepareManualTranslation({
        candidate: "test-omega",
        version: "2026-04-25",
        lang: "de",
      }),
    ).rejects.toThrow(/LANGUAGE_LABELS/);
  });
});

describe("ingestTranslation", () => {
  /** Build an EN translation by mutating only allowlisted prose. */
  function buildValidEnTranslation(): unknown {
    const fr = buildValidAggregatedOutput();
    const tr = JSON.parse(JSON.stringify(fr));
    tr.summary = "[EN] " + tr.summary;
    tr.dimensions.economic_fiscal.summary = "[EN] dimension prose";
    tr.dimensions.economic_fiscal.headline.text = "[EN] headline";
    tr.positioning.economic.anchor_narrative = "[EN] axis narrative";
    return tr;
  }

  test("happy path: writes draft and translations.<lang> metadata", async () => {
    const root = await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });

    const inputPath = join(root, "input-en.json");
    await writeFile(
      inputPath,
      JSON.stringify(buildValidEnTranslation(), null, 2),
    );

    const result = await ingestTranslation({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
      mode: "manual-webchat",
      attestedVersion: "claude-opus-4-7",
      attestedBy: "test-operator",
      file: inputPath,
    });

    const draft = await readFile(result.draftPath, "utf-8");
    const draftJson = JSON.parse(draft);
    expect(draftJson.summary.startsWith("[EN]")).toBe(true);

    const meta = JSON.parse(await readFile(result.metadataPath, "utf-8"));
    VersionMetadataSchema.parse(meta);
    expect(meta.translations.en.execution_mode).toBe("manual-webchat");
    expect(meta.translations.en.attested_model_version).toBe(
      "claude-opus-4-7",
    );
    expect(meta.translations.en.human_review_completed).toBe(false);
    expect(meta.translations.en.prompt_file).toBe(
      "prompts/translate-aggregated.md",
    );
    expect(meta.translations.en.prompt_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test("rejects tampered numeric value", async () => {
    const root = await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });
    const tr = JSON.parse(JSON.stringify(buildValidAggregatedOutput()));
    tr.summary = "[EN] tampered";
    tr.positioning.economic.modal_score = 0; // was -2
    const inputPath = join(root, "input-en.json");
    await writeFile(inputPath, JSON.stringify(tr, null, 2));

    await expect(
      ingestTranslation({
        candidate: "test-omega",
        version: "2026-04-25",
        lang: "en",
        mode: "manual-webchat",
        attestedVersion: "claude-opus-4-7",
        attestedBy: "test-operator",
        file: inputPath,
      }),
    ).rejects.toThrow(/parity check failed/i);

    // Draft file must NOT exist after a failed parity check.
    const verDir = join(root, "candidates/test-omega/versions/2026-04-25");
    const draftPath = join(verDir, "aggregated.en.draft.json");
    await expect(readFile(draftPath, "utf-8")).rejects.toThrow();
  });

  test("idempotent re-ingest with --force overwrites draft and bumps ingested_at", async () => {
    const root = await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });
    const inputPath = join(root, "input-en.json");
    await writeFile(
      inputPath,
      JSON.stringify(buildValidEnTranslation(), null, 2),
    );

    const first = await ingestTranslation({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
      mode: "manual-webchat",
      attestedVersion: "claude-opus-4-7",
      attestedBy: "test-operator",
      file: inputPath,
    });
    const meta1 = JSON.parse(await readFile(first.metadataPath, "utf-8"));
    const t1 = meta1.translations.en.ingested_at;

    // Wait at least 1ms so ISO timestamp can differ.
    await new Promise((r) => setTimeout(r, 5));

    const second = await ingestTranslation({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
      mode: "manual-webchat",
      attestedVersion: "claude-opus-4-7",
      attestedBy: "test-operator",
      file: inputPath,
      force: true,
    });
    const meta2 = JSON.parse(await readFile(second.metadataPath, "utf-8"));
    const t2 = meta2.translations.en.ingested_at;
    expect(t2 >= t1).toBe(true);
    expect(t2 !== t1).toBe(true);
  });

  test("refuses to overwrite existing draft without --force", async () => {
    const root = await scaffoldTempProject({
      candidate: "test-omega",
      version: "2026-04-25",
      withAggregated: true,
    });
    const inputPath = join(root, "input-en.json");
    await writeFile(
      inputPath,
      JSON.stringify(buildValidEnTranslation(), null, 2),
    );
    await ingestTranslation({
      candidate: "test-omega",
      version: "2026-04-25",
      lang: "en",
      mode: "manual-webchat",
      attestedVersion: "claude-opus-4-7",
      attestedBy: "test-operator",
      file: inputPath,
    });
    await expect(
      ingestTranslation({
        candidate: "test-omega",
        version: "2026-04-25",
        lang: "en",
        mode: "manual-webchat",
        attestedVersion: "claude-opus-4-7",
        attestedBy: "test-operator",
        file: inputPath,
      }),
    ).rejects.toThrow(/already exists/);
  });
});
