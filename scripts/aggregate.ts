#!/usr/bin/env tsx
/**
 * Stage 4: Aggregate raw-outputs/ → aggregated.draft.json + aggregation-notes.md
 * See docs/specs/data-pipeline/overview.md
 */
import { Command } from "commander";
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./lib/logger";
import { hashString } from "./lib/hash";
import { versionDir, rawOutputsDir, PROJECT_ROOT } from "./lib/paths";
import { VersionMetadataSchema, AggregatedOutputSchema, type VersionMetadata } from "./lib/schema";
import { validateAndWrite } from "./lib/validate";
import type { LLMProvider } from "./lib/providers";
import { normalizeArgv } from "./lib/cli-args";

const log = createLogger({ script: "aggregate" });

const MIN_RECOMMENDED_MODELS = 3;

export interface AggregateOptions {
  candidate: string;
  version: string;
  force?: boolean;
  verbose?: boolean;
  provider: LLMProvider;
}

export interface RawOutput {
  model: string;
  content: unknown;
}

async function loadRawOutputs(outputDir: string): Promise<RawOutput[]> {
  let files: string[];
  try {
    files = await readdir(outputDir);
  } catch {
    return [];
  }

  const jsonFiles = files.filter(
    (f) => f.endsWith(".json") && !f.endsWith(".FAILED.json"),
  );

  const outputs: RawOutput[] = [];
  for (const file of jsonFiles) {
    const content = JSON.parse(await readFile(join(outputDir, file), "utf-8"));
    const model = file.replace(/\.json$/, "");
    outputs.push({ model, content });
  }

  return outputs;
}

function generateAggregationNotes(
  candidate: string,
  version: string,
  models: string[],
  rawOutputCount: number,
): string {
  return [
    `# Aggregation Notes — ${candidate} (${version})`,
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Models aggregated:** ${models.join(", ")}`,
    `**Raw outputs found:** ${rawOutputCount}`,
    "",
    rawOutputCount < MIN_RECOMMENDED_MODELS
      ? `> ⚠️ Warning: Only ${rawOutputCount} model(s) succeeded. Recommend at least ${MIN_RECOMMENDED_MODELS} for robust aggregation.`
      : `✅ ${rawOutputCount} models — meets minimum recommendation of ${MIN_RECOMMENDED_MODELS}.`,
    "",
    "## Review Required",
    "",
    "- [ ] Check consensus themes for accuracy",
    "- [ ] Review dissent items — are disagreements genuine or formatting artifacts?",
    "- [ ] Verify flagged claims against sources.md",
    "",
  ].join("\n");
}

export async function aggregate(opts: AggregateOptions): Promise<void> {
  const { candidate, version, provider } = opts;
  const verDir = versionDir(candidate, version);
  const outputDir = rawOutputsDir(candidate, version);
  const draftPath = join(verDir, "aggregated.draft.json");
  const notesPath = join(verDir, "aggregation-notes.md");
  const sourcesPath = join(verDir, "sources.md");
  const metadataPath = join(verDir, "metadata.json");

  log.info({ candidate, version }, "Starting aggregation");

  // Load raw outputs
  const rawOutputs = await loadRawOutputs(outputDir);

  if (rawOutputs.length === 0) {
    throw new Error(
      `No successful raw outputs found in ${outputDir}. Run analysis first.`,
    );
  }

  if (rawOutputs.length < MIN_RECOMMENDED_MODELS) {
    log.warn(
      { count: rawOutputs.length, recommended: MIN_RECOMMENDED_MODELS },
      "Fewer models than recommended",
    );
  }

  log.info({ modelCount: rawOutputs.length }, "Loaded raw outputs");

  // Check existing draft
  if (!opts.force) {
    try {
      await access(draftPath);
      log.warn("aggregated.draft.json already exists. Use --force to overwrite.");
      return;
    } catch {
      // doesn't exist — proceed
    }
  }

  // Read sources.md for context
  let sourcesContent = "";
  try {
    sourcesContent = await readFile(sourcesPath, "utf-8");
  } catch {
    log.warn("sources.md not found — aggregator will lack source context");
  }

  // Read aggregation prompt
  const promptPath = join(PROJECT_ROOT, "prompts", "aggregate-analyses.md");
  const promptContent = await readFile(promptPath, "utf-8");
  const promptSha256 = hashString(promptContent);

  // Build the source content for the LLM: sources + all raw outputs
  const modelInputs = rawOutputs
    .map((o) => `### Model: ${o.model}\n\`\`\`json\n${JSON.stringify(o.content, null, 2)}\n\`\`\``)
    .join("\n\n");

  const sourceContent = [
    "## Consolidated Sources",
    sourcesContent,
    "",
    "## Individual Model Analyses",
    modelInputs,
  ].join("\n\n");

  // Call aggregator LLM with retry-on-schema-drift.
  const MAX_RETRIES = 2;
  let parsed: unknown;
  let lastError: Error | null = null;
  let lastResult: Awaited<ReturnType<typeof provider.call>> | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      log.info({ attempt }, "Retrying aggregator");
    }
    try {
      lastResult = await provider.call({
        model: "claude-opus-4-0-20250514",
        prompt: promptContent,
        sourceContent,
        temperature: 0,
      });
      parsed = JSON.parse(lastResult.content);
      AggregatedOutputSchema.parse(parsed);
      lastError = null;
      break;
    } catch (err) {
      lastError = err as Error;
      log.warn({ attempt, error: lastError.message }, "Aggregator attempt failed");
      parsed = undefined;
    }
  }

  if (lastError || !parsed || !lastResult) {
    const failedPath = join(verDir, "aggregated.FAILED.json");
    const failedOutput: {
      candidate_id: string;
      version_date: string;
      attempts: number;
      last_error: string;
      issues?: unknown;
    } = {
      candidate_id: candidate,
      version_date: version,
      attempts: MAX_RETRIES + 1,
      last_error: lastError?.message ?? "unknown",
    };
    if (lastError && "issues" in lastError) {
      failedOutput.issues = (lastError as { issues: unknown }).issues;
    }
    await writeFile(failedPath, JSON.stringify(failedOutput, null, 2), "utf-8");
    log.error(
      { path: failedPath },
      "Aggregator exhausted retries, wrote aggregated.FAILED.json",
    );
    throw lastError ?? new Error("Aggregator failed");
  }

  const result = lastResult;

  // Write draft
  await writeFile(draftPath, JSON.stringify(parsed, null, 2), "utf-8");
  log.info({ path: draftPath }, "Aggregated draft written");

  // Write aggregation notes
  const notes = generateAggregationNotes(
    candidate,
    version,
    rawOutputs.map((o) => o.model),
    rawOutputs.length,
  );
  await writeFile(notesPath, notes, "utf-8");
  log.info({ path: notesPath }, "Aggregation notes written");

  // Update metadata
  let metadata: VersionMetadata;
  try {
    const existing = JSON.parse(await readFile(metadataPath, "utf-8"));
    metadata = existing;
  } catch {
    metadata = {
      candidate_id: candidate,
      version_date: version,
      schema_version: "1.0",
    };
  }

  metadata.aggregation = {
    prompt_file: "prompts/aggregate-analyses.md",
    prompt_sha256: promptSha256,
    prompt_version: "0.1",
    aggregator_model: {
      provider: provider.id,
      exact_version: result.model,
      run_at: new Date().toISOString(),
      execution_mode: "api",
      provider_metadata_available: true,
    },
    human_review_completed: false,
  };

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info("Metadata updated");
  log.info("Draft produced. Human review of flagged items required.");
}

// CLI
const program = new Command();
program
  .name("aggregate")
  .description("Aggregate raw model outputs into synthesis")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .option("--force", "Overwrite existing draft", false)
  .option("--verbose", "Verbose output", false)
  .action(async (_opts) => {
    log.error("Direct CLI execution requires provider configuration. Use the pipeline orchestrator.");
    process.exit(1);
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/aggregate.ts") ||
    process.argv[1].endsWith("/aggregate.js"));
if (isDirectRun) {
  program.parse(normalizeArgv(process.argv));
}
