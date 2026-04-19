#!/usr/bin/env tsx
/**
 * Ingest a raw analysis output produced outside the API pipeline.
 *
 * Used for manual-webchat (operator pastes JSON) and copilot-agent
 * (Copilot wrote the file directly) modes. Validates, stamps
 * attestation metadata, and refuses prompt-hash drift within a
 * version.
 *
 * See docs/specs/data-pipeline/analysis-modes.md
 */
import { Command } from "commander";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createLogger } from "./lib/logger";
import { hashString } from "./lib/hash";
import * as paths from "./lib/paths";
import {
  AnalysisOutputSchema,
  ExecutionModeSchema,
  VersionMetadataSchema,
  type ModelRunEntry,
  type VersionMetadata,
} from "./lib/schema";
import { validateAndWrite, validateOrThrow } from "./lib/validate";

const log = createLogger({ script: "ingest-raw-output" });

type NonApiMode = "manual-webchat" | "copilot-agent";

export interface IngestRawOptions {
  candidate: string;
  version: string;
  model: string;
  mode: NonApiMode;
  attestedVersion: string;
  attestedBy: string;
  file: string;
  provider?: string;
  force?: boolean;
  alreadyWritten?: boolean;
}

/** Strip a single fenced ```json / ``` wrapper if present. */
export function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\n([\s\S]*?)\n```\s*$/);
  return match ? match[1] : trimmed;
}

function defaultProviderFor(mode: NonApiMode): string {
  return mode === "copilot-agent" ? "copilot" : "manual";
}

/** Core ingest operation. Returns the written raw-output path. */
export async function ingestRawOutput(
  opts: IngestRawOptions,
): Promise<{ rawOutputPath: string; metadataPath: string }> {
  const {
    candidate,
    version,
    model,
    mode,
    attestedVersion,
    attestedBy,
    file,
    provider,
    force = false,
    alreadyWritten = false,
  } = opts;

  // Validate mode (defensive — CLI enforces this via enum, but we may
  // be called programmatically).
  validateOrThrow(ExecutionModeSchema, mode, "--mode");
  if ((mode as string) === "api") {
    throw new Error(
      "ingest-raw-output does not accept --mode api (use scripts/analyze.ts)",
    );
  }

  const verDir = paths.versionDir(candidate, version);
  if (!paths.pathExists(verDir)) {
    throw new Error(`Version directory not found: ${verDir}`);
  }

  const rawDir = paths.rawOutputsDir(candidate, version);
  const rawOutputPath = join(rawDir, `${model}.json`);

  // Read and validate the input JSON.
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
    AnalysisOutputSchema,
    parsed,
    `raw analysis for ${model}`,
  );

  // Compute canonical prompt hash.
  const promptFile = "prompts/analyze-candidate.md";
  const promptRaw = await readFile(
    resolve(process.cwd(), promptFile),
    "utf-8",
  );
  const promptSha256 = hashString(promptRaw);

  // Load or init metadata.
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

  // Prompt-hash drift guard: any existing analysis block must match.
  if (metadata.analysis) {
    if (metadata.analysis.prompt_sha256 !== promptSha256) {
      throw new Error(
        `Prompt SHA256 mismatch: metadata has ${metadata.analysis.prompt_sha256}, current prompt is ${promptSha256}. ` +
          `Mixing prompt versions within one version folder is forbidden. ` +
          `Start a new version or restore the original prompt.`,
      );
    }
  }

  // Overwrite guard for raw-output file (unless --already-written).
  if (!alreadyWritten && paths.pathExists(rawOutputPath) && !force) {
    throw new Error(
      `${rawOutputPath} already exists. Pass --force to overwrite.`,
    );
  }

  // Write raw output (unless already written).
  if (!alreadyWritten) {
    await mkdir(rawDir, { recursive: true });
    await writeFile(
      rawOutputPath,
      JSON.stringify(validated, null, 2) + "\n",
      "utf-8",
    );
    log.info({ rawOutputPath }, "Raw output written");
  } else {
    // If --already-written, the file must exist.
    if (!paths.pathExists(rawOutputPath)) {
      throw new Error(
        `--already-written was passed but ${rawOutputPath} does not exist`,
      );
    }
  }

  // Build / update the model entry.
  const entry: ModelRunEntry = {
    provider: provider ?? defaultProviderFor(mode),
    exact_version: attestedVersion,
    temperature: 0,
    status: "success",
    run_at: new Date().toISOString(),
    execution_mode: mode,
    attested_by: attestedBy,
    attested_model_version: attestedVersion,
    provider_metadata_available: false,
  };

  const existingAnalysis = metadata.analysis ?? {
    prompt_file: promptFile,
    prompt_sha256: promptSha256,
    prompt_version: "0.1",
    models: {},
  };

  metadata.analysis = {
    ...existingAnalysis,
    prompt_file: promptFile,
    prompt_sha256: promptSha256,
    prompt_version: existingAnalysis.prompt_version ?? "0.1",
    models: {
      ...existingAnalysis.models,
      [model]: entry,
    },
  };

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info(
    { model, mode, attestedVersion, attestedBy },
    "Metadata updated",
  );

  return { rawOutputPath, metadataPath };
}

// CLI
const program = new Command();
program
  .name("ingest-raw-output")
  .description("Validate and register a raw analysis output (manual or copilot mode)")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .requiredOption("--model <slug>", "Model slug (becomes filename)")
  .requiredOption(
    "--mode <mode>",
    "Execution mode: manual-webchat | copilot-agent",
  )
  .requiredOption(
    "--attested-version <string>",
    "Exact model version string attested by the operator",
  )
  .requiredOption(
    "--attested-by <string>",
    "Operator attestation identifier (name, handle, user ID)",
  )
  .requiredOption("--file <path>", "Path to JSON file to ingest")
  .option("--provider <name>", "Provider name (defaults to manual/copilot)")
  .option("--force", "Overwrite existing raw-output file", false)
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
      await ingestRawOutput({
        candidate: opts.candidate,
        version: opts.version,
        model: opts.model,
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
  (process.argv[1].endsWith("/ingest-raw-output.ts") ||
    process.argv[1].endsWith("/ingest-raw-output.js"));
if (isDirectRun) {
  program.parse();
}
