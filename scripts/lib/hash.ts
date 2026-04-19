/**
 * SHA256 hashing utilities.
 * See docs/specs/data-pipeline/overview.md — prompt hashing section.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

/** Compute SHA256 of a file's contents. Returns lowercase hex string. */
export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/** Compute SHA256 of a UTF-8 string. Returns lowercase hex string. */
export function hashString(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}
