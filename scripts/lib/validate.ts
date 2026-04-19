/**
 * Schema validation helpers.
 * See docs/specs/data-pipeline/overview.md — schema validation halts pipeline.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ZodSchema, ZodIssue } from "zod";

/** Typed validation error that preserves Zod issue details. */
export class ValidationError extends Error {
  public readonly issues: ZodIssue[];

  constructor(label: string, issues: ZodIssue[]) {
    const summary = issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    super(`Validation failed for "${label}":\n${summary}`);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

/** Validate data against a Zod schema. Throws ValidationError on failure. */
export function validateOrThrow<T>(
  schema: ZodSchema<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(label, result.error.issues);
  }
  return result.data;
}

/** Validate data against a Zod schema and write JSON to disk. Returns validated data. */
export async function validateAndWrite<T>(
  schema: ZodSchema<T>,
  data: unknown,
  outputPath: string,
): Promise<T> {
  const validated = validateOrThrow(schema, data, outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(validated, null, 2) + "\n", "utf-8");
  return validated;
}
