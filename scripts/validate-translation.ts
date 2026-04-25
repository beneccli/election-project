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
import { isTranslatablePath } from "./lib/translatable-paths";
import { versionDir } from "./lib/paths";
import { normalizeArgv } from "./lib/cli-args";
import { ValidationError, validateOrThrow } from "./lib/validate";

export interface ParityIssue {
  path: string;
  kind:
    | "type-mismatch"
    | "value-mismatch"
    | "array-length-mismatch"
    | "missing-key"
    | "extra-key";
  message: string;
}

export class ParityError extends Error {
  constructor(public issues: ParityIssue[]) {
    super(`Translation parity check failed (${issues.length} issue(s))`);
    this.name = "ParityError";
  }
}

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

function typeOf(v: Json): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/**
 * Walk `fr` and `tr` in lockstep. For every leaf:
 * - object/array shapes must match (same keys / same length).
 * - non-translatable leaves must be deepEqual.
 * - translatable string leaves may differ, but their type must remain
 *   `string` (no swapping a string for null/number).
 */
function walk(fr: Json, tr: Json, path: string, issues: ParityIssue[]): void {
  const frType = typeOf(fr);
  const trType = typeOf(tr);

  if (frType !== trType) {
    issues.push({
      path,
      kind: "type-mismatch",
      message: `expected ${frType}, got ${trType}`,
    });
    return;
  }

  if (frType === "array") {
    const frArr = fr as Json[];
    const trArr = tr as Json[];
    if (frArr.length !== trArr.length) {
      issues.push({
        path,
        kind: "array-length-mismatch",
        message: `expected length ${frArr.length}, got ${trArr.length}`,
      });
      return;
    }
    for (let i = 0; i < frArr.length; i++) {
      walk(frArr[i], trArr[i], `${path}.${i}`, issues);
    }
    return;
  }

  if (frType === "object") {
    const frObj = fr as { [k: string]: Json };
    const trObj = tr as { [k: string]: Json };
    const frKeys = Object.keys(frObj);
    const trKeys = Object.keys(trObj);
    const frKeySet = new Set(frKeys);
    const trKeySet = new Set(trKeys);
    for (const k of frKeys) {
      if (!trKeySet.has(k)) {
        issues.push({
          path: path === "" ? k : `${path}.${k}`,
          kind: "missing-key",
          message: `key present in FR but missing in translation`,
        });
      }
    }
    for (const k of trKeys) {
      if (!frKeySet.has(k)) {
        issues.push({
          path: path === "" ? k : `${path}.${k}`,
          kind: "extra-key",
          message: `key present in translation but absent in FR`,
        });
      }
    }
    for (const k of frKeys) {
      if (!trKeySet.has(k)) continue;
      const childPath = path === "" ? k : `${path}.${k}`;
      walk(frObj[k], trObj[k], childPath, issues);
    }
    return;
  }

  // Leaf scalar: string, number, boolean, null.
  if (isTranslatablePath(path)) {
    // Allowed to differ, but only for string-valued leaves. If FR has
    // a null in a translatable slot the translation must also be null
    // (so we don't allow translation to fabricate prose).
    if (frType === "string") {
      // Type already matched; any string value is acceptable.
      return;
    }
    // Non-string leaf in an allowlisted slot — fall through to strict
    // equality check.
  }

  if (fr !== tr) {
    issues.push({
      path,
      kind: "value-mismatch",
      message:
        `expected ${JSON.stringify(fr)}, got ${JSON.stringify(tr)}` +
        (isTranslatablePath(path)
          ? " (path is translatable but leaf is non-string)"
          : ""),
    });
  }
}

/**
 * Compare a translation to the FR canonical file. Throws
 * {@link ParityError} on failure, otherwise returns silently.
 */
export function checkParity(fr: unknown, tr: unknown): void {
  const issues: ParityIssue[] = [];
  walk(fr as Json, tr as Json, "", issues);
  if (issues.length > 0) {
    throw new ParityError(issues);
  }
}

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
