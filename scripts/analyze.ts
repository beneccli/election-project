#!/usr/bin/env tsx
/**
 * Stage 3: Analyze sources.md → raw-outputs/ (parallel across LLMs)
 * See docs/specs/data-pipeline/overview.md
 */
import { Command } from "commander";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./lib/logger.js";
import { hashString } from "./lib/hash.js";
import { versionDir, rawOutputsDir, PROJECT_ROOT } from "./lib/paths.js";
import { VersionMetadataSchema, type VersionMetadata } from "./lib/schema.js";
import { AnalysisOutputSchema } from "./lib/schema.js";
import { validateAndWrite } from "./lib/validate.js";
import type { LLMProvider, LLMCallResult } from "./lib/providers.js";
import { DEFAULT_MODELS, type ModelConfig } from "./config/models.js";

const log = createLogger({ script: "analyze" });

const MAX_RETRIES = 2;

export interface AnalyzeOptions {
  candidate: string;
  version: string;
  force?: boolean;
  models?: string[];
  verbose?: boolean;
  /** Map of provider ID → LLMProvider instance */
  providers: Record<string, LLMProvider>;
}

export interface ModelRunResult {
  model: string;
  provider: string;
  status: "success" | "failed";
  exactVersion?: string;
  tokensIn?: number;
  tokensOut?: number;
  costEstimateUsd?: number;
  durationMs?: number;
  error?: string;
}

async function analyzeWithModel(
  config: ModelConfig,
  provider: LLMProvider,
  prompt: string,
  sourcesContent: string,
  outputDir: string,
  force: boolean,
): Promise<ModelRunResult> {
  const outputPath = join(outputDir, `${config.model}.json`);
  const failedPath = join(outputDir, `${config.model}.FAILED.json`);

  // Check if output already exists
  if (!force) {
    try {
      await access(outputPath);
      log.info({ model: config.model }, "Output already exists, skipping");
      return {
        model: config.model,
        provider: config.provider,
        status: "success",
        exactVersion: config.model,
      };
    } catch {
      // doesn't exist — proceed
    }
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        log.info({ model: config.model, attempt }, "Retrying");
      }

      const result: LLMCallResult = await provider.call({
        model: config.model,
        prompt,
        sourceContent: sourcesContent,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      // Parse and validate JSON
      const parsed = JSON.parse(result.content);
      AnalysisOutputSchema.parse(parsed);

      // Write output
      await writeFile(outputPath, JSON.stringify(parsed, null, 2), "utf-8");
      log.info({ model: config.model }, "Output written");

      return {
        model: config.model,
        provider: config.provider,
        status: "success",
        exactVersion: result.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costEstimateUsd: result.costEstimateUsd,
        durationMs: result.durationMs,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn(
        { model: config.model, attempt, error: lastError.message },
        "Attempt failed",
      );
    }
  }

  // All retries exhausted
  const failedOutput = {
    model: config.model,
    provider: config.provider,
    error: lastError?.message ?? "Unknown error",
    retries: MAX_RETRIES,
    timestamp: new Date().toISOString(),
  };
  await writeFile(failedPath, JSON.stringify(failedOutput, null, 2), "utf-8");
  log.error({ model: config.model }, "All retries exhausted, wrote FAILED file");

  return {
    model: config.model,
    provider: config.provider,
    status: "failed",
    error: lastError?.message,
  };
}

export async function analyze(opts: AnalyzeOptions): Promise<ModelRunResult[]> {
  const { candidate, version, providers } = opts;
  const verDir = versionDir(candidate, version);
  const sourcesPath = join(verDir, "sources.md");
  const outputDir = rawOutputsDir(candidate, version);
  const metadataPath = join(verDir, "metadata.json");

  log.info({ candidate, version }, "Starting analysis");

  // Validate sources.md exists (not .draft)
  try {
    await access(sourcesPath);
  } catch {
    throw new Error(
      `sources.md not found at ${sourcesPath}. Human review gate must be cleared before analysis.`,
    );
  }

  const sourcesContent = await readFile(sourcesPath, "utf-8");

  // Read analysis prompt
  const promptPath = join(PROJECT_ROOT, "prompts", "analyze-candidate.md");
  const promptContent = await readFile(promptPath, "utf-8");
  const promptSha256 = hashString(promptContent);

  // Ensure raw-outputs/ exists
  await mkdir(outputDir, { recursive: true });

  // Filter models if --models specified
  let models = DEFAULT_MODELS;
  if (opts.models && opts.models.length > 0) {
    models = DEFAULT_MODELS.filter((m) => opts.models!.includes(m.model));
    if (models.length === 0) {
      throw new Error(`No matching models found for: ${opts.models.join(", ")}`);
    }
  }

  log.info({ modelCount: models.length }, "Running analysis");

  // Run all models in parallel
  const results = await Promise.allSettled(
    models.map((config) => {
      const provider = providers[config.provider];
      if (!provider) {
        return Promise.reject(
          new Error(`No provider configured for: ${config.provider}`),
        );
      }
      return analyzeWithModel(
        config,
        provider,
        promptContent,
        sourcesContent,
        outputDir,
        opts.force ?? false,
      );
    }),
  );

  const runResults: ModelRunResult[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      model: models[i].model,
      provider: models[i].provider,
      status: "failed" as const,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });

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

  const modelsRecord: Record<string, unknown> = {};
  for (const r of runResults) {
    modelsRecord[r.model] = {
      provider: r.provider,
      exact_version: r.exactVersion ?? r.model,
      temperature: models.find((m) => m.model === r.model)?.temperature ?? 0,
      tokens_in: r.tokensIn ?? 0,
      tokens_out: r.tokensOut ?? 0,
      cost_estimate_usd: r.costEstimateUsd ?? 0,
      duration_ms: r.durationMs ?? 0,
      status: r.status,
      run_at: new Date().toISOString(),
    };
  }

  metadata.analysis = {
    prompt_file: "prompts/analyze-candidate.md",
    prompt_sha256: promptSha256,
    prompt_version: "0.1",
    models: modelsRecord as VersionMetadata["analysis"] extends { models: infer M } ? M : never,
  };

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info({ promptSha256 }, "Metadata updated");

  const succeeded = runResults.filter((r) => r.status === "success").length;
  const failed = runResults.filter((r) => r.status === "failed").length;
  log.info({ succeeded, failed }, "Analysis complete");

  return runResults;
}

// CLI
const program = new Command();
program
  .name("analyze")
  .description("Run LLM analysis on sources.md")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .option("--force", "Re-run even if output exists", false)
  .option("--models <models>", "Comma-separated list of model IDs", (v) =>
    v.split(","),
  )
  .option("--verbose", "Verbose output", false)
  .action(async (_opts) => {
    // In real usage, providers would be constructed here based on env config
    // For now, this is a placeholder — real provider wiring in M_DataPipeline later tasks
    log.error("Direct CLI execution requires provider configuration. Use the pipeline orchestrator.");
    process.exit(1);
  });

// Only parse when run directly (not when imported for testing)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/analyze.ts") ||
    process.argv[1].endsWith("/analyze.js"));
if (isDirectRun) {
  program.parse();
}
