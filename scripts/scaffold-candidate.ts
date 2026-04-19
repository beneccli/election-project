#!/usr/bin/env tsx
/**
 * Scaffold a new candidate folder structure.
 * See docs/specs/candidates/repository-structure.md
 */
import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "./lib/logger";
import { candidateDir, versionDir, sourcesRawDir, pathExists } from "./lib/paths";
import { CandidateMetadataSchema, VersionMetadataSchema } from "./lib/schema";
import { validateAndWrite } from "./lib/validate";
import { normalizeArgv } from "./lib/cli-args";

const log = createLogger({ script: "scaffold-candidate" });

const CANDIDATE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ScaffoldOptions {
  id: string;
  name: string;
  party: string;
  partyId?: string;
  date?: string;
  isFictional?: boolean;
}

const FICTIONAL_BANNER = `> ⚠️ **PROGRAMME FICTIF — TEST CANDIDATE**
>
> This candidate is synthetic. It was generated for pipeline testing
> and does not represent any real person, party, or political program.
> Any resemblance to real policy is coincidental. This document must
> never be cited outside a test context.

`;

export async function scaffoldCandidate(opts: ScaffoldOptions): Promise<void> {
  const { id, name, party, isFictional = false } = opts;
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const partyId = opts.partyId ?? id;

  // Validate ID format
  if (!CANDIDATE_ID_PATTERN.test(id)) {
    throw new Error(
      `Invalid candidate ID "${id}". Must be lowercase kebab-case: ${CANDIDATE_ID_PATTERN}`,
    );
  }

  // Symmetric fictional-prefix guard. The `test-` prefix and the
  // --is-fictional flag must always agree. This keeps visual
  // distinction reliable and prevents silent laundering.
  const hasTestPrefix = id.startsWith("test-");
  if (isFictional && !hasTestPrefix) {
    throw new Error(
      `--is-fictional requires the candidate ID to start with "test-". Got "${id}".`,
    );
  }
  if (hasTestPrefix && !isFictional) {
    throw new Error(
      `Candidate ID "${id}" starts with "test-" but --is-fictional was not set. ` +
        `Either drop the "test-" prefix or pass --is-fictional.`,
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
    ...(isFictional ? { is_fictional: true } : {}),
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

  // Fictional candidates get a banner in a sources.md.draft so the
  // fictional nature is visible to any human reviewing the program.
  if (isFictional) {
    const draftPath = join(versionDir(id, date), "sources.md.draft");
    await writeFile(
      draftPath,
      FICTIONAL_BANNER + `# ${name} — programme (fictional)\n\n_\u00c0 remplir par le script de génération ou par l'opérateur._\n`,
      "utf-8",
    );
    log.info({ draftPath }, "Fictional sources.md.draft seeded");
  }

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
  .option(
    "--is-fictional",
    "Mark this candidate as a fictional test candidate (requires test- prefix)",
    false,
  )
  .action(async (cliOpts) => {
    try {
      await scaffoldCandidate({
        id: cliOpts.id,
        name: cliOpts.name,
        party: cliOpts.party,
        partyId: cliOpts.partyId,
        date: cliOpts.date,
        isFictional: cliOpts.isFictional,
      });
    } catch (err) {
      log.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Scaffold failed",
      );
      process.exit(1);
    }
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/scaffold-candidate.ts") ||
    process.argv[1].endsWith("/scaffold-candidate.js"));
if (isDirectRun) {
  program.parse(normalizeArgv(process.argv));
}
