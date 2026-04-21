// See docs/specs/website/transparency.md §6 "Build-time contract"
//
// Pure helpers for building the content-addressed prompt snapshot under
// `site/public/prompts/<sha256>.md`. The main script (in site/scripts/)
// is a thin CLI wrapper over these functions so they can be unit-tested
// without touching disk at test time.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type PromptManifestEntry = {
  logical_name: string;
  sha256: string;
  byte_length: number;
};

export type PromptManifest = {
  files: PromptManifestEntry[];
};

/**
 * Recursively list every `*.md` file under `root`, returning POSIX-style
 * paths relative to `root` (the "logical name"). Sorted for determinism.
 */
export function listPromptFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, rel: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        walk(abs, r);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        out.push(r);
      }
    }
  };
  if (!fs.existsSync(root)) return out;
  walk(root, "");
  out.sort();
  return out;
}

/**
 * SHA256 the bytes of a file as a lowercase hex string.
 * Must match `scripts/lib/hash.ts#hashFile` byte-for-byte — the drawer
 * relies on this equivalence.
 */
export function sha256File(absPath: string): { sha256: string; byteLength: number } {
  const buf = fs.readFileSync(absPath);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  return { sha256, byteLength: buf.byteLength };
}

/**
 * Write the content-addressed snapshot for every `*.md` under
 * `promptsRoot`, and emit the accompanying `manifest.json`.
 *
 * - `publicPromptsDir` is emptied before the snapshot is written
 *   (idempotent, safe to re-run).
 * - Multiple logical names can share the same sha (identical bytes);
 *   the content file is written once, the manifest carries both
 *   logical-name entries.
 */
export function snapshotPrompts(
  promptsRoot: string,
  publicPromptsDir: string,
): PromptManifest {
  fs.rmSync(publicPromptsDir, { recursive: true, force: true });
  fs.mkdirSync(publicPromptsDir, { recursive: true });

  const entries: PromptManifestEntry[] = [];
  for (const logical of listPromptFiles(promptsRoot)) {
    const abs = path.join(promptsRoot, logical);
    const { sha256, byteLength } = sha256File(abs);
    const dest = path.join(publicPromptsDir, `${sha256}.md`);
    // Copy once per unique hash; overwriting same bytes is a no-op.
    fs.copyFileSync(abs, dest);
    entries.push({ logical_name: logical, sha256, byte_length: byteLength });
  }
  entries.sort((a, b) => a.logical_name.localeCompare(b.logical_name));

  const manifest: PromptManifest = { files: entries };
  fs.writeFileSync(
    path.join(publicPromptsDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return manifest;
}
