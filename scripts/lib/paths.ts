/**
 * Candidate/version path resolution helpers.
 * See docs/specs/candidates/repository-structure.md
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { accessSync, readlinkSync } from "node:fs";

/** Project root directory (two levels up from scripts/lib/).
 *
 * Tests that spawn a CLI subprocess can override this by setting the
 * `ELECTION_PROJECT_ROOT` environment variable to point at a sandbox
 * directory. Production runs never set this variable.
 */
const PROJECT_ROOT = process.env.ELECTION_PROJECT_ROOT
  ? resolve(process.env.ELECTION_PROJECT_ROOT)
  : resolve(fileURLToPath(import.meta.url), "..", "..", "..");

export { PROJECT_ROOT };

/** Resolve candidates/<id>/ directory. */
export function candidateDir(candidateId: string): string {
  return resolve(PROJECT_ROOT, "candidates", candidateId);
}

/** Resolve candidates/<id>/versions/<date>/ directory. */
export function versionDir(
  candidateId: string,
  versionDate: string,
): string {
  return resolve(candidateDir(candidateId), "versions", versionDate);
}

/** Resolve candidates/<id>/current symlink target directory. */
export function currentVersionDir(candidateId: string): string {
  const symlinkPath = resolve(candidateDir(candidateId), "current");
  const target = readlinkSync(symlinkPath);
  // Symlink may be relative; resolve from the candidate dir
  return resolve(candidateDir(candidateId), target);
}

/** Resolve candidates/<id>/versions/<date>/raw-outputs/ directory. */
export function rawOutputsDir(
  candidateId: string,
  versionDate: string,
): string {
  return resolve(versionDir(candidateId, versionDate), "raw-outputs");
}

/** Resolve candidates/<id>/versions/<date>/sources-raw/ directory. */
export function sourcesRawDir(
  candidateId: string,
  versionDate: string,
): string {
  return resolve(versionDir(candidateId, versionDate), "sources-raw");
}

/** Check if a path exists (sync). */
export function pathExists(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch {
    return false;
  }
}
