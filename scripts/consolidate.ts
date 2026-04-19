#!/usr/bin/env tsx
/**
 * Stage 2: Consolidate sources-raw/ → sources.md.draft
 * See docs/specs/data-pipeline/overview.md
 */
import { Command } from "commander";
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./lib/logger";
import { hashString } from "./lib/hash";
import { versionDir, sourcesRawDir } from "./lib/paths";
import { extractSourcesFromDir, formatSourcesForPrompt } from "./lib/sources";
import { VersionMetadataSchema } from "./lib/schema";
import { validateAndWrite } from "./lib/validate";
import { PROJECT_ROOT } from "./lib/paths";
import type { LLMProvider } from "./lib/providers";

const log = createLogger({ script: "consolidate" });

export interface ConsolidateOptions {
  candidate: string;
  version: string;
  force?: boolean;
  dryRun?: boolean;
  provider?: LLMProvider;
}

export async function consolidate(opts: ConsolidateOptions): Promise<void> {
  const { candidate, version } = opts;
  const verDir = versionDir(candidate, version);
  const srcRawDir = sourcesRawDir(candidate, version);
  const draftPath = join(verDir, "sources.md.draft");
  const metadataPath = join(verDir, "metadata.json");

  log.info({ candidate, version }, "Starting consolidation");

  // Validate sources-raw/ exists and is non-empty
  try {
    await access(srcRawDir);
  } catch {
    throw new Error(`sources-raw/ directory not found: ${srcRawDir}`);
  }

  const sources = await extractSourcesFromDir(srcRawDir);
  if (sources.length === 0) {
    throw new Error(`sources-raw/ directory is empty: ${srcRawDir}`);
  }

  log.info({ count: sources.length }, "Extracted source files");

  // Check if draft already exists
  if (!opts.force) {
    try {
      await access(draftPath);
      log.warn("sources.md.draft already exists. Use --force to overwrite.");
      return;
    } catch {
      // File doesn't exist — good
    }
  }

  // Read the consolidation prompt
  const promptPath = join(PROJECT_ROOT, "prompts", "consolidate-sources.md");
  const promptContent = await readFile(promptPath, "utf-8");
  const promptSha256 = hashString(promptContent);

  // Format sources for the prompt
  const sourceText = formatSourcesForPrompt(sources);

  if (opts.dryRun) {
    log.info("Dry run — would call LLM with prompt and sources");
    log.info({ promptSha256, sourceFileCount: sources.length });
    return;
  }

  // Call LLM
  const provider = opts.provider;
  if (!provider) {
    throw new Error("No LLM provider configured for consolidation");
  }

  const result = await provider.call({
    model: "claude-opus-4-0-20250514",
    prompt: promptContent,
    sourceContent: sourceText,
    temperature: 0,
  });

  // Write the draft
  await writeFile(draftPath, result.content, "utf-8");
  log.info({ path: draftPath }, "Draft written");

  // Update or create version metadata
  let metadata;
  try {
    const existing = JSON.parse(await readFile(metadataPath, "utf-8"));
    metadata = {
      ...existing,
      sources: {
        ...existing.sources,
        consolidation_method: "human_review_of_llm_draft",
        consolidation_prompt_sha256: promptSha256,
        consolidation_prompt_version: "0.1",
      },
    };
  } catch {
    metadata = {
      candidate_id: candidate,
      version_date: version,
      schema_version: "1.0",
      sources: {
        consolidation_method: "human_review_of_llm_draft",
        consolidation_prompt_sha256: promptSha256,
        consolidation_prompt_version: "0.1",
      },
    };
  }

  await validateAndWrite(VersionMetadataSchema, metadata, metadataPath);
  log.info({ promptSha256 }, "Metadata updated with prompt hash");

  log.info(
    "Draft produced at sources.md.draft. Human review required before proceeding.",
  );
}

// CLI entry point
const program = new Command()
  .name("consolidate")
  .description("Consolidate sources-raw/ into sources.md.draft")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .option("--force", "Overwrite existing draft", false)
  .option("--dry-run", "Validate inputs without executing", false)
  .option("--verbose", "Debug-level logging", false);

// Only run CLI when executed directly (not imported)
const isDirectExecution =
  process.argv[1]?.endsWith("consolidate.ts") ||
  process.argv[1]?.endsWith("consolidate.js");

if (isDirectExecution) {
  program.parse();
  const opts = program.opts();
  consolidate({
    candidate: opts.candidate,
    version: opts.version,
    force: opts.force,
    dryRun: opts.dryRun,
  }).catch((err: unknown) => {
    log.error(err, "Consolidation failed");
    process.exit(1);
  });
}
