#!/usr/bin/env tsx
/**
 * Translation parity validator.
 *
 * Asserts that `aggregated.<lang>.json` is structurally identical to
 * the FR canonical `aggregated.json` — same numbers, same scores,
 * same array lengths, same identifiers, same object keys — and that
 * only allowlisted prose string fields differ.
 *
 * See docs/specs/website/i18n.md §2.4.
 *
 * Usage:
 *   tsx scripts/validate-translation.ts --candidate <id> --version <date> --lang <code>
 *
 * Exit codes:
 *   0 — translation file passes parity check (or `--lang fr` trivially)
 *   1 — parity check failed; structured errors printed to stderr
 */
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AggregatedOutputSchema } from "./lib/schema";
import { versionDir } from "./lib/paths";
import { normalizeArgv } from "./lib/cli-args";
import { ValidationError, validateOrThrow } from "./lib/validate";
import {
  ParityError,
  type ParityIssue,
  checkParity,
} from "./lib/parity";

export { ParityError, checkParity };
export type { ParityIssue };

interface ValidateArgs {
  candidate: string;
  version: string;
  lang: string;
}

async function readJson(path: string): Promise<unknown> {
  const text = await readFile(path, "utf-8");
  return JSON.parse(text);
}

export async function validateTranslation(args: ValidateArgs): Promise<void> {
  const dir = versionDir(args.candidate, args.version);
  const frPath = resolve(dir, "aggregated.json");
  const trPath =
    args.lang === "fr"
      ? frPath
      : resolve(dir, `aggregated.${args.lang}.json`);

  const frJson = await readJson(frPath);
  const trJson = await readJson(trPath);

  // Both must parse against the same schema (no schema_version bump).
  validateOrThrow(AggregatedOutputSchema, frJson, frPath);
  validateOrThrow(AggregatedOutputSchema, trJson, trPath);

  checkParity(frJson, trJson);
}

async function main(args: ValidateArgs): Promise<void> {
  if (!/^[a-z]{2}$/.test(args.lang)) {
    process.stderr.write(
      `--lang must be an ISO 639-1 lowercase code (got "${args.lang}")\n`,
    );
    process.exit(1);
  }
  try {
    await validateTranslation(args);
    process.stdout.write(
      `OK: aggregated.${args.lang}.json passes parity check ` +
        `against FR (candidate=${args.candidate} version=${args.version})\n`,
    );
    process.exit(0);
  } catch (err) {
    if (err instanceof ParityError) {
      process.stderr.write(`INVALID translation (${err.issues.length} issue(s)):\n`);
      for (const issue of err.issues) {
        process.stderr.write(
          `  [${issue.kind}] ${issue.path || "<root>"}: ${issue.message}\n`,
        );
      }
    } else if (err instanceof ValidationError) {
      process.stderr.write(`SCHEMA ERROR (${err.message}):\n`);
      for (const issue of err.issues) {
        process.stderr.write(
          `  ${issue.path.join(".") || "<root>"}: ${issue.message}\n`,
        );
      }
    } else {
      process.stderr.write(
        `ERROR: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
    process.exit(1);
  }
}

const program = new Command();
program
  .name("validate-translation")
  .description(
    "Validate aggregated.<lang>.json structural parity with FR canonical",
  )
  .requiredOption("--candidate <id>", "Candidate id")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .requiredOption("--lang <code>", "ISO 639-1 language code (e.g. en)")
  .action(async (opts) => {
    await main({
      candidate: opts.candidate,
      version: opts.version,
      lang: opts.lang,
    });
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/validate-translation.ts") ||
    process.argv[1].endsWith("/validate-translation.js"));
if (isDirectRun) {
  program.parse(normalizeArgv(process.argv));
}
