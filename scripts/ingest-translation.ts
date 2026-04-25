#!/usr/bin/env tsx
/**
 * Ingest a translated aggregated output produced outside the API
 * pipeline (manual web-chat or copilot-agent).
 *
 * Writes `aggregated.<lang>.draft.json` (never the final
 * `aggregated.<lang>.json` — promotion is a manual `mv` after human
 * review). Updates `metadata.json` with a `translations.<lang>` block
 * recording prompt provenance and attestation.
 *
 * See docs/specs/website/i18n.md §3.2 and §3.3.
 */
import { Command } from "commander";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createLogger } from "./lib/logger";
import { hashString } from "./lib/hash";
import * as paths from "./lib/paths";
import {
  AggregatedOutputSchema,
  ExecutionModeSchema,
  VersionMetadataSchema,
  type VersionMetadata,
} from "./lib/schema";
import { stripJsonFence } from "./ingest-raw-output";
import { validateAndWrite, validateOrThrow } from "./lib/validate";
import { normalizeArgv } from "./lib/cli-args";
import { checkParity } from "./validate-translation";

const log = createLogger({ script: "ingest-translation" });

type NonApiMode = "manual-webchat" | "copilot-agent";

export interface IngestTranslationOptions {
  candidate: string;
  version: string;
  lang: string;
  mode: NonApiMode;
  attestedVersion: string;
  attestedBy: string;
  file: string;
  force?: boolean;
}

export async function ingestTranslation(
  opts: IngestTranslationOptions,
): Promise<{ draftPath: string; metadataPath: string }> {
  const {
    candidate,
    version,
    lang,
    mode,
    attestedVersion,
    attestedBy,
    file,
    force = false,
  } = opts;

  if (!/^[a-z]{2}$/.test(lang)) {
    throw new Error(`--lang must be an ISO 639-1 lowercase code (got "${lang}")`);
  }
  if (lang === "fr") {
    throw new Error(
      `--lang fr is invalid: FR is the canonical file, not a translation.`,
    );
  }

  validateOrThrow(ExecutionModeSchema, mode, "--mode");
  if ((mode as string) === "api") {
    throw new Error(
      "ingest-translation does not accept --mode api (translations are manual)",
    );
  }

  const verDir = paths.versionDir(candidate, version);
  if (!paths.pathExists(verDir)) {
    throw new Error(`Version directory not found: ${verDir}`);
  }

  const frPath = join(verDir, "aggregated.json");
  if (!paths.pathExists(frPath)) {
    throw new Error(
      `FR canonical not found at ${frPath}. ` +
        `Aggregation must complete first (promote draft to aggregated.json).`,
    );
  }

  // Parse + schema-validate input.
  const inputPath = resolve(file);
  const rawText = await readFile(inputPath, "utf-8");
  const cleaned = stripJsonFence(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Input file is not valid JSON after fence-stripping: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  const validated = validateOrThrow(
    AggregatedOutputSchema,
    parsed,
    `translated aggregated output (${lang})`,
  );

  // Parity check against FR.
  const frJson = JSON.parse(await readFile(frPath, "utf-8"));
  checkParity(frJson, validated);

  // Write draft.
  const draftPath = join(verDir, `aggregated.${lang}.draft.json`);
  if (paths.pathExists(draftPath) && !force) {
    throw new Error(
      `${draftPath} already exists. Pass --force to overwrite.`,
    );
  }
  await writeFile(
    draftPath,
    JSON.stringify(validated, null, 2) + "\n",
    "utf-8",
  );
  log.info({ draftPath, lang }, "Translation draft written");

  // Update metadata.
  const promptFile = "prompts/translate-aggregated.md";
  const promptRaw = await readFile(
    resolve(process.cwd(), promptFile),
    "utf-8",
  );
  const promptSha256 = hashString(promptRaw);

  const metadataPath = join(verDir, "metadata.json");
  let metadata: VersionMetadata;
  try {
    metadata = JSON.parse(await readFile(metadataPath, "utf-8"));
  } catch {
    metadata = {
      candidate_id: candidate,
      version_date: version,
      schema_version: "1.0",
    };
  }

  const translations = { ...(metadata.translations ?? {}) };
  const previous = translations[lang];
  if (previous && previous.prompt_sha256 !== promptSha256) {
    log.warn(
      {
        lang,
        previous_sha256: previous.prompt_sha256,
        current_sha256: promptSha256,
      },
      "Translation prompt SHA256 changed since previous ingest for this lang. " +
        "This is a new prompt version; review the diff before promoting.",
    );
  }

  translations[lang] = {
    prompt_file: promptFile,
    prompt_sha256: promptSha256,
    prompt_version: previous?.prompt_version ?? "1.0",
    execution_mode: mode,
    attested_model_version: attestedVersion,
    ingested_at: new Date().toISOString(),
    human_review_completed: false,
    reviewer: attestedBy,
  };
  metadata.translations = translations;

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info(
    { mode, attestedVersion, attestedBy, lang },
    "Metadata translations block updated",
  );

  // eslint-disable-next-line no-console
  console.log(
    `\nNext steps:\n` +
      `  1. Review the draft visually:\n` +
      `       ${draftPath}\n` +
      `  2. After human review, promote to final:\n` +
      `       mv ${draftPath} ${join(verDir, `aggregated.${lang}.json`)}\n` +
      `  3. Set translations.${lang}.human_review_completed = true in metadata.json.\n`,
  );

  return { draftPath, metadataPath };
}

// CLI
const program = new Command();
program
  .name("ingest-translation")
  .description(
    "Validate and register a translated aggregated.<lang>.draft.json",
  )
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .requiredOption("--lang <code>", "ISO 639-1 target language code (e.g. en)")
  .option(
    "--mode <mode>",
    "Execution mode: manual-webchat | copilot-agent",
    "manual-webchat",
  )
  .requiredOption(
    "--attested-version <string>",
    "Exact translator model version attested by operator",
  )
  .requiredOption(
    "--attested-by <string>",
    "Operator attestation identifier",
  )
  .requiredOption("--input <path>", "Path to translated JSON to ingest")
  .option("--force", "Overwrite existing draft", false)
  .action(async (opts) => {
    try {
      const mode = opts.mode;
      if (mode !== "manual-webchat" && mode !== "copilot-agent") {
        throw new Error(
          `--mode must be manual-webchat or copilot-agent, got ${mode}`,
        );
      }
      await ingestTranslation({
        candidate: opts.candidate,
        version: opts.version,
        lang: opts.lang,
        mode,
        attestedVersion: opts.attestedVersion,
        attestedBy: opts.attestedBy,
        file: opts.input,
        force: opts.force,
      });
    } catch (err) {
      log.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Translation ingest failed",
      );
      process.exit(1);
    }
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/ingest-translation.ts") ||
    process.argv[1].endsWith("/ingest-translation.js"));
if (isDirectRun) {
  program.parse(normalizeArgv(process.argv));
}
