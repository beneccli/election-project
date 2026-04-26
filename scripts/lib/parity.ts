/**
 * Translation parity check helpers.
 *
 * Exported from this module so both the standalone CLI validator
 * (`scripts/validate-translation.ts`) and the website build-time
 * loader (`site/lib/candidates.ts`) can share the same logic.
 *
 * See docs/specs/website/i18n.md §2.4.
 */
import { isTranslatablePath } from "./translatable-paths";

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

  // Leaf scalar.
  if (isTranslatablePath(path) && frType === "string") {
    return;
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

/**
 * Non-throwing variant: returns the issues array (empty on success).
 * Used by the build-time loader where parity drift is a warning, not
 * a hard failure.
 */
export function collectParityIssues(fr: unknown, tr: unknown): ParityIssue[] {
  const issues: ParityIssue[] = [];
  walk(fr as Json, tr as Json, "", issues);
  return issues;
}
