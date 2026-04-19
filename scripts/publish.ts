#!/usr/bin/env tsx
/**
 * Stage 5: Publish — validate artifacts and update current symlink.
 * See docs/specs/data-pipeline/overview.md
 */
import { Command } from "commander";
import { readFile, symlink, unlink, lstat } from "node:fs/promises";
import { join, relative } from "node:path";
import { createLogger } from "./lib/logger";
import {
  candidateDir,
  versionDir,
  pathExists,
} from "./lib/paths";
import {
  VersionMetadataSchema,
  AggregatedOutputSchema,
  CandidateMetadataSchema,
} from "./lib/schema";
import { validateAndWrite } from "./lib/validate";

const log = createLogger({ script: "publish" });

export interface PublishOptions {
  candidate: string;
  version: string;
  dryRun?: boolean;
  verbose?: boolean;
  allowFictional?: boolean;
}

export async function publish(opts: PublishOptions): Promise<void> {
  const { candidate, version } = opts;
  const verDir = versionDir(candidate, version);
  const candDir = candidateDir(candidate);

  log.info({ candidate, version }, "Starting publish validation");

  // 0. Fictional-candidate guard. Fictional candidates can never
  //    become `current` without an explicit --allow-fictional override.
  const candMetadataPath = join(candDir, "metadata.json");
  if (await pathExists(candMetadataPath)) {
    const candMeta = CandidateMetadataSchema.parse(
      JSON.parse(await readFile(candMetadataPath, "utf-8")),
    );
    if (candMeta.is_fictional) {
      if (!opts.allowFictional) {
        throw new Error(
          `Candidate "${candidate}" is marked is_fictional: true. ` +
            `Refusing to publish. Pass --allow-fictional if this is an intentional test publish.`,
        );
      }
      log.warn(
        { candidate },
        "Publishing a FICTIONAL candidate (--allow-fictional was set). This must not happen in production.",
      );
    }
  }

  // 1. Validate sources.md exists (not draft)
  const sourcesPath = join(verDir, "sources.md");
  if (!(await pathExists(sourcesPath))) {
    throw new Error(`sources.md not found at ${sourcesPath}. Human review must be completed.`);
  }

  // 2. Validate aggregated.json exists (not draft)
  const aggregatedPath = join(verDir, "aggregated.json");
  if (!(await pathExists(aggregatedPath))) {
    throw new Error(
      `aggregated.json not found at ${aggregatedPath}. Rename aggregated.draft.json after human review.`,
    );
  }

  const aggregated = JSON.parse(await readFile(aggregatedPath, "utf-8"));
  AggregatedOutputSchema.parse(aggregated);
  log.info("aggregated.json validated");

  // 3. Validate metadata has human_review_completed
  const metadataPath = join(verDir, "metadata.json");
  if (!(await pathExists(metadataPath))) {
    throw new Error(`metadata.json not found at ${metadataPath}`);
  }

  const metadata = VersionMetadataSchema.parse(
    JSON.parse(await readFile(metadataPath, "utf-8")),
  );

  if (!metadata.aggregation?.human_review_completed) {
    throw new Error(
      "metadata.json aggregation.human_review_completed is not true. Human review required before publishing.",
    );
  }
  log.info("Version metadata validated");

  if (opts.dryRun) {
    log.info("Dry run — all validations passed, no filesystem changes.");
    return;
  }

  // 4. Update current symlink
  const symlinkPath = join(candDir, "current");
  const targetRelative = relative(candDir, verDir);

  try {
    const stat = await lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      await unlink(symlinkPath);
    }
  } catch {
    // doesn't exist
  }

  await symlink(targetRelative, symlinkPath, "dir");
  log.info({ symlink: symlinkPath, target: targetRelative }, "Symlink updated");

  // 5. Update candidate metadata.json `updated` field
  const candMetadataPathFinal = join(candDir, "metadata.json");
  if (await pathExists(candMetadataPathFinal)) {
    const candMetadata = JSON.parse(await readFile(candMetadataPathFinal, "utf-8"));
    candMetadata.updated = version;
    await validateAndWrite(CandidateMetadataSchema, candMetadata, candMetadataPathFinal);
    log.info("Candidate metadata updated");
  }

  log.info(
    { candidate, version },
    `Published: candidates/${candidate}/current → versions/${version}/`,
  );
}

// CLI
const program = new Command();
program
  .name("publish")
  .description("Validate and publish a candidate version")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .option("--dry-run", "Validate without modifying filesystem", false)
  .option("--verbose", "Verbose output", false)
  .option(
    "--allow-fictional",
    "Permit publishing a candidate flagged is_fictional (testing only)",
    false,
  )
  .action(async (_opts) => {
    log.error("Direct CLI execution not yet wired. Use the pipeline orchestrator.");
    process.exit(1);
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/publish.ts") ||
    process.argv[1].endsWith("/publish.js"));
if (isDirectRun) {
  program.parse();
}
