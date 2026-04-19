#!/usr/bin/env tsx
/**
 * Standalone validator: does <file> parse as a valid AnalysisOutput
 * or AggregatedOutput?
 *
 * Used by the Copilot agent workflow to self-check before ingest.
 * Exits 0 on success, 1 on failure. Prints structured Zod issues.
 */
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ZodSchema } from "zod";
import {
  AggregatedOutputSchema,
  AnalysisOutputSchema,
} from "./lib/schema";
import { stripJsonFence } from "./ingest-raw-output";
import { ValidationError, validateOrThrow } from "./lib/validate";

type Kind = "analysis" | "aggregated" | "auto";

function detectKind(parsed: unknown): Exclude<Kind, "auto"> {
  if (parsed && typeof parsed === "object" && "dissent" in parsed) {
    return "aggregated";
  }
  return "analysis";
}

async function main(file: string, kind: Kind): Promise<void> {
  const path = resolve(file);
  const text = await readFile(path, "utf-8");
  const cleaned = stripJsonFence(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    process.stderr.write(
      `INVALID: not JSON — ${
        err instanceof Error ? err.message : String(err)
      }\n`,
    );
    process.exit(1);
  }

  const resolved: Exclude<Kind, "auto"> =
    kind === "auto" ? detectKind(parsed) : kind;
  const schema: ZodSchema<unknown> =
    resolved === "aggregated" ? AggregatedOutputSchema : AnalysisOutputSchema;

  try {
    validateOrThrow(schema, parsed, path);
    process.stdout.write(`OK: ${path} is a valid ${resolved} output\n`);
    process.exit(0);
  } catch (err) {
    if (err instanceof ValidationError) {
      process.stderr.write(`INVALID (${resolved}):\n`);
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
  .name("validate-raw")
  .description("Validate a raw-analysis or aggregated JSON file against the schema")
  .requiredOption("--file <path>", "Path to JSON file")
  .option(
    "--kind <kind>",
    "Schema: analysis | aggregated | auto (default auto)",
    "auto",
  )
  .action(async (opts) => {
    const kind = opts.kind as Kind;
    if (kind !== "analysis" && kind !== "aggregated" && kind !== "auto") {
      process.stderr.write(
        `--kind must be analysis, aggregated, or auto; got ${kind}\n`,
      );
      process.exit(1);
    }
    await main(opts.file, kind);
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/validate-raw.ts") ||
    process.argv[1].endsWith("/validate-raw.js"));
if (isDirectRun) {
  program.parse();
}
