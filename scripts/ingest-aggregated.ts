#!/usr/bin/env tsx
/**
 * Ingest an aggregated output produced outside the API pipeline.
 *
 * Writes `aggregated.draft.json` (never `aggregated.json` — that gate
 * is owned by the review CLI from M_Aggregation). Updates metadata
 * with attestation fields.
 *
 * See docs/specs/data-pipeline/analysis-modes.md
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
  type AggregatorModel,
  type VersionMetadata,
} from "./lib/schema";
import { stripJsonFence } from "./ingest-raw-output";
import { validateAndWrite, validateOrThrow } from "./lib/validate";
import { normalizeArgv } from "./lib/cli-args";

const log = createLogger({ script: "ingest-aggregated" });

type NonApiMode = "manual-webchat" | "copilot-agent";

export interface IngestAggregatedOptions {
  candidate: string;
  version: string;
  mode: NonApiMode;
  attestedVersion: string;
  attestedBy: string;
  file: string;
  provider?: string;
  force?: boolean;
  alreadyWritten?: boolean;
}

function defaultProviderFor(mode: NonApiMode): string {
  return mode === "copilot-agent" ? "copilot" : "manual";
}

export async function ingestAggregated(
  opts: IngestAggregatedOptions,
): Promise<{ draftPath: string; metadataPath: string }> {
  const {
    candidate,
    version,
    mode,
    attestedVersion,
    attestedBy,
    file,
    provider,
    force = false,
    alreadyWritten = false,
  } = opts;

  validateOrThrow(ExecutionModeSchema, mode, "--mode");
  if ((mode as string) === "api") {
    throw new Error(
      "ingest-aggregated does not accept --mode api (use scripts/aggregate.ts)",
    );
  }

  const verDir = paths.versionDir(candidate, version);
  if (!paths.pathExists(verDir)) {
    throw new Error(`Version directory not found: ${verDir}`);
  }

  const draftPath = join(verDir, "aggregated.draft.json");

  // Validate input JSON.
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
    "aggregated output",
  );

  const promptFile = "prompts/aggregate-analyses.md";
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

  if (metadata.aggregation) {
    if (metadata.aggregation.prompt_sha256 !== promptSha256) {
      throw new Error(
        `Aggregation prompt SHA256 mismatch: metadata has ${metadata.aggregation.prompt_sha256}, current prompt is ${promptSha256}. ` +
          `Mixing aggregation prompt versions within one version folder is forbidden.`,
      );
    }
  }

  if (!alreadyWritten && paths.pathExists(draftPath) && !force) {
    throw new Error(
      `${draftPath} already exists. Pass --force to overwrite.`,
    );
  }

  if (!alreadyWritten) {
    await writeFile(
      draftPath,
      JSON.stringify(validated, null, 2) + "\n",
      "utf-8",
    );
    log.info({ draftPath }, "Aggregated draft written");
  } else {
    if (!paths.pathExists(draftPath)) {
      throw new Error(
        `--already-written was passed but ${draftPath} does not exist`,
      );
    }
  }

  const aggregatorModel: AggregatorModel = {
    provider: provider ?? defaultProviderFor(mode),
    exact_version: attestedVersion,
    run_at: new Date().toISOString(),
    execution_mode: mode,
    attested_by: attestedBy,
    attested_model_version: attestedVersion,
    provider_metadata_available: false,
  };

  metadata.aggregation = {
    prompt_file: promptFile,
    prompt_sha256: promptSha256,
    prompt_version: metadata.aggregation?.prompt_version ?? "0.1",
    aggregator_model: aggregatorModel,
    human_review_completed: false,
  };

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info({ mode, attestedVersion, attestedBy }, "Metadata updated");

  return { draftPath, metadataPath };
}

const program = new Command();
program
  .name("ingest-aggregated")
  .description("Validate and register an aggregated output draft (manual or copilot mode)")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .requiredOption(
    "--mode <mode>",
    "Execution mode: manual-webchat | copilot-agent",
  )
  .requiredOption(
    "--attested-version <string>",
    "Exact aggregator model version attested by operator",
  )
  .requiredOption(
    "--attested-by <string>",
    "Operator attestation identifier",
  )
  .requiredOption("--file <path>", "Path to aggregated JSON to ingest")
  .option("--provider <name>", "Provider name (defaults to manual/copilot)")
  .option("--force", "Overwrite existing aggregated.draft.json", false)
  .option(
    "--already-written",
    "File was written directly (Copilot mode); skip copy",
    false,
  )
  .action(async (opts) => {
    try {
      const mode = opts.mode;
      if (mode !== "manual-webchat" && mode !== "copilot-agent") {
        throw new Error(
          `--mode must be manual-webchat or copilot-agent, got ${mode}`,
        );
      }
      await ingestAggregated({
        candidate: opts.candidate,
        version: opts.version,
        mode,
        attestedVersion: opts.attestedVersion,
        attestedBy: opts.attestedBy,
        file: opts.file,
        provider: opts.provider,
        force: opts.force,
        alreadyWritten: opts.alreadyWritten,
      });
    } catch (err) {
      log.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Ingest failed",
      );
      process.exit(1);
    }
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/ingest-aggregated.ts") ||
    process.argv[1].endsWith("/ingest-aggregated.js"));
if (isDirectRun) {
  program.parse(normalizeArgv(process.argv));
}
