#!/usr/bin/env tsx
/**
 * Scaffold a new candidate folder structure.
 * See docs/specs/candidates/repository-structure.md
 */
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./lib/logger.js";
import { candidateDir, versionDir, sourcesRawDir, pathExists } from "./lib/paths.js";
import { CandidateMetadataSchema, VersionMetadataSchema } from "./lib/schema.js";
import { validateAndWrite } from "./lib/validate.js";

const log = createLogger({ script: "scaffold-candidate" });

const CANDIDATE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ScaffoldOptions {
  id: string;
  name: string;
  party: string;
  partyId?: string;
  date?: string;
}

export async function scaffoldCandidate(opts: ScaffoldOptions): Promise<void> {
  const { id, name, party } = opts;
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const partyId = opts.partyId ?? id;

  // Validate ID format
  if (!CANDIDATE_ID_PATTERN.test(id)) {
    throw new Error(
      `Invalid candidate ID "${id}". Must be lowercase kebab-case: ${CANDIDATE_ID_PATTERN}`,
    );
  }

  // Check if candidate already exists
  const candDir = candidateDir(id);
  if (await pathExists(candDir)) {
    throw new Error(`Candidate "${id}" already exists at ${candDir}`);
  }

  log.info({ id, name, party, date }, "Scaffolding candidate");

  // Create directory structure
  const srcRawDir = sourcesRawDir(id, date);
  await mkdir(srcRawDir, { recursive: true });
  await writeFile(join(srcRawDir, ".gitkeep"), "", "utf-8");

  // Create raw-outputs dir
  const rawDir = join(versionDir(id, date), "raw-outputs");
  await mkdir(rawDir, { recursive: true });
  await writeFile(join(rawDir, ".gitkeep"), "", "utf-8");

  // Create candidate metadata.json
  const candMetadata = {
    id,
    display_name: name,
    party,
    party_id: partyId,
    created: date,
    updated: date,
  };
  await validateAndWrite(CandidateMetadataSchema, candMetadata, join(candDir, "metadata.json"));
  log.info("Candidate metadata created");

  // Create version metadata.json skeleton
  const verMetadata = {
    candidate_id: id,
    version_date: date,
    schema_version: "1.0",
  };
  await validateAndWrite(
    VersionMetadataSchema,
    verMetadata,
    join(versionDir(id, date), "metadata.json"),
  );
  log.info("Version metadata skeleton created");

  log.info({ id }, "Candidate scaffolded successfully");
}

// CLI
const program = new Command();
program
  .name("scaffold-candidate")
  .description("Create a new candidate folder structure")
  .requiredOption("--id <id>", "Candidate ID (lowercase kebab-case)")
  .requiredOption("--name <name>", "Display name")
  .requiredOption("--party <party>", "Party name")
  .option("--party-id <partyId>", "Party ID (defaults to candidate ID)")
  .option("--date <date>", "Initial version date (YYYY-MM-DD, defaults to today)")
  .action(async (_opts) => {
    log.error("Direct CLI execution not yet wired.");
    process.exit(1);
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/scaffold-candidate.ts") ||
    process.argv[1].endsWith("/scaffold-candidate.js"));
if (isDirectRun) {
  program.parse();
}
