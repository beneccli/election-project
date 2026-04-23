#!/usr/bin/env tsx
/**
 * Merge a directory of aggregated-output part files into a single
 * `aggregated.draft.json`.
 *
 * Motivation: the copilot-agent aggregation mode produces large
 * (~150–250KB) JSON. Writing it in a single `create_file` call exceeds
 * Copilot's tool-call payload envelope and fails after several minutes.
 * Splitting into N smaller files under a working directory — each a
 * valid JSON object containing one or more top-level keys of the final
 * document — sidesteps the limit. This script then assembles the parts
 * into the single `aggregated.draft.json` expected by
 * `scripts/ingest-aggregated.ts`.
 *
 * Merge rules:
 *   - Parts are merged in lexicographic filename order (use `00-`, `01-`,
 *     … prefixes to control ordering).
 *   - Top-level values must be plain JSON objects.
 *   - Duplicate primitive / array keys across parts are an error.
 *   - Duplicate object keys are merged recursively with the same rules.
 *
 * See docs/specs/data-pipeline/analysis-modes.md ("Mode 3 —
 * copilot-agent") and `.github/prompts/aggregate-analyses-via-copilot.prompt.md`.
 */
import { Command } from "commander";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createLogger } from "./lib/logger";

const log = createLogger({ script: "merge-aggregated-parts" });

type JsonObject = { [key: string]: unknown };

function isPlainObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function mergeInto(
  target: JsonObject,
  source: JsonObject,
  pathForErrors: string[] = [],
): void {
  for (const [key, value] of Object.entries(source)) {
    const here = [...pathForErrors, key];
    if (!(key in target)) {
      target[key] = value;
      continue;
    }
    const existing = target[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      mergeInto(existing, value, here);
      continue;
    }
    throw new Error(
      `Conflict at "${here.join(".")}": key present in multiple parts with a non-object value (cannot merge).`,
    );
  }
}

export function mergeParts(files: { name: string; contents: string }[]): JsonObject {
  const merged: JsonObject = {};
  for (const { name, contents } of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contents);
    } catch (err) {
      throw new Error(
        `${name}: invalid JSON — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    if (!isPlainObject(parsed)) {
      throw new Error(
        `${name}: top-level value must be a JSON object, got ${
          Array.isArray(parsed) ? "array" : typeof parsed
        }.`,
      );
    }
    mergeInto(merged, parsed, [name]);
  }
  return merged;
}

async function main(partsDir: string, outFile: string): Promise<void> {
  const dir = resolve(partsDir);
  const entries = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (entries.length === 0) {
    throw new Error(`No .json parts found in ${dir}`);
  }
  const files = entries.map((f) => ({
    name: f,
    contents: readFileSync(join(dir, f), "utf-8"),
  }));
  const merged = mergeParts(files);
  const out = resolve(outFile);
  writeFileSync(out, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  log.info(
    { partsDir: dir, outFile: out, partCount: files.length },
    "Merged aggregated parts",
  );
}

const program = new Command();
program
  .name("merge-aggregated-parts")
  .description(
    "Merge JSON part files from a working directory into a single aggregated.draft.json",
  )
  .requiredOption(
    "--parts-dir <dir>",
    "Directory containing part-NN-*.json files",
  )
  .requiredOption(
    "--out <file>",
    "Output path (typically candidates/<id>/versions/<date>/aggregated.draft.json)",
  )
  .action(async (opts) => {
    try {
      await main(opts.partsDir, opts.out);
    } catch (err) {
      log.error(
        { err: err instanceof Error ? err.message : String(err) },
        "merge-aggregated-parts failed",
      );
      process.exit(1);
    }
  });

// Only parse CLI args when executed directly (not when imported by tests).
const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("merge-aggregated-parts.ts");
if (invokedDirectly) {
  program.parse();
}
