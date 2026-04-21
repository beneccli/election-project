// See docs/specs/website/transparency.md §4 "Index"
//
// Pure helpers for building `sources-raw/manifest.json` for a candidate
// version. The copy script calls `buildSourcesRawManifest` after it has
// copied a version's `sources-raw/` folder into the public dir.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type SourcesRawManifestEntry = {
  filename: string;
  byte_length: number;
  sha256: string;
  origin_url?: string;
  accessed_at?: string;
  [k: string]: unknown;
};

export type SourcesRawManifest = {
  files: SourcesRawManifestEntry[];
};

const EXCLUDE_BASENAMES = new Set([".DS_Store", ".gitkeep", "manifest.json"]);

function isExcluded(name: string): boolean {
  if (EXCLUDE_BASENAMES.has(name)) return true;
  if (name.endsWith(".meta.json")) return true;
  return false;
}

/**
 * Read optional `<filename>.meta.json` sidecar and merge its keys into the
 * manifest entry (filename/byte_length/sha256 from the real file win).
 */
function readSidecar(absPath: string): Record<string, unknown> {
  const sidecar = `${absPath}.meta.json`;
  if (!fs.existsSync(sidecar)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(sidecar, "utf8"));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Build a manifest for `<versionDir>/sources-raw/`. Creates an empty
 * manifest when the folder is missing or empty.
 */
export function buildSourcesRawManifest(
  sourcesRawDir: string,
): SourcesRawManifest {
  if (!fs.existsSync(sourcesRawDir)) return { files: [] };

  const entries: SourcesRawManifestEntry[] = [];
  for (const name of fs.readdirSync(sourcesRawDir).sort()) {
    if (isExcluded(name)) continue;
    const abs = path.join(sourcesRawDir, name);
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;
    const buf = fs.readFileSync(abs);
    const sha256 = createHash("sha256").update(buf).digest("hex");
    const sidecar = readSidecar(abs);
    entries.push({
      ...sidecar,
      filename: name,
      byte_length: buf.byteLength,
      sha256,
    });
  }
  return { files: entries };
}

/** Write the manifest file adjacent to the sources-raw files. */
export function writeSourcesRawManifest(
  sourcesRawDir: string,
  manifest: SourcesRawManifest,
): void {
  fs.mkdirSync(sourcesRawDir, { recursive: true });
  fs.writeFileSync(
    path.join(sourcesRawDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}
