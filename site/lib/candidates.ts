// See docs/specs/website/nextjs-architecture.md §2
// See docs/specs/website/i18n.md §4 (locale-aware loader)
import fs from "node:fs";
import path from "node:path";
import { ZodError, type ZodIssue } from "zod";
import {
  AggregatedOutputSchema,
  CandidateMetadataSchema,
  VersionMetadataSchema,
  type AggregatedOutput,
  type CandidateMetadata,
  type VersionMetadata,
} from "./schema";
import { collectParityIssues } from "@pipeline/parity";
import type { Lang } from "./i18n";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CandidateIndexEntry {
  id: string;
  displayName: string;
  party: string;
  partyId: string;
  isFictional: boolean;
  versionDate: string;
  updatedAt: string;
  /** Locales that have a published `aggregated.<lang>.json` file in
   *  the candidate's `current/` directory. FR is always included
   *  (it is the canonical source). */
  availableLocales: Lang[];
}

export interface RawModelSummary {
  modelId: string;
  provider: string;
  exactVersion: string;
  promptSha256: string;
  status: string;
  executionMode: string;
}

/**
 * Translation status surfaced on the bundle. Pages branch on this to
 * render a "translation missing" banner when the requested locale
 * does not have a published file. See spec §6.
 */
export type TranslationStatus =
  | { lang: "fr"; status: "native_fr" }
  | { lang: Exclude<Lang, "fr">; status: "available" | "missing" };

export interface CandidateBundle {
  meta: CandidateMetadata;
  versionMeta: VersionMetadata;
  /** The aggregated payload to render. For non-FR locales this is the
   *  translation file when present, or the FR canonical file as
   *  fallback. The shape is identical (same schema_version 1.2). */
  aggregated: AggregatedOutput;
  rawSummaries: RawModelSummary[];
  translation: TranslationStatus;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CandidateDataError extends Error {
  readonly id: string;
  readonly path: string;
  readonly zodIssues?: ZodIssue[];

  constructor(params: {
    id: string;
    path: string;
    message: string;
    zodIssues?: ZodIssue[];
  }) {
    super(`[${params.id}] ${params.message} (${params.path})`);
    this.name = "CandidateDataError";
    this.id = params.id;
    this.path = params.path;
    this.zodIssues = params.zodIssues;
  }
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

function resolveCandidatesDir(): string {
  const override = process.env.CANDIDATES_DIR;
  if (override && override.length > 0) {
    return path.resolve(override);
  }
  return path.resolve(process.cwd(), "..", "candidates");
}

function readJson<T = unknown>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// listCandidates
// ---------------------------------------------------------------------------

export function listCandidates(): CandidateIndexEntry[] {
  const root = resolveCandidatesDir();
  if (!fs.existsSync(root)) return [];

  const excludeFictional = process.env.EXCLUDE_FICTIONAL === "1";
  const entries: CandidateIndexEntry[] = [];

  for (const id of fs.readdirSync(root).sort()) {
    const candidateDir = path.join(root, id);
    const stat = fs.statSync(candidateDir);
    if (!stat.isDirectory()) continue;

    const metaPath = path.join(candidateDir, "metadata.json");
    if (!fs.existsSync(metaPath)) continue;

    let meta: CandidateMetadata;
    try {
      meta = CandidateMetadataSchema.parse(readJson(metaPath));
    } catch {
      // Skip candidates with malformed root metadata — they will fail
      // loudly on loadCandidate if actually requested.
      continue;
    }

    // See docs/specs/candidates/visibility.md — hidden candidates are
    // excluded from every listing surface unconditionally.
    if (meta.hidden === true) continue;
    if (excludeFictional && meta.is_fictional === true) continue;

    const currentDir = path.join(candidateDir, "current");
    const aggregatedPath = path.join(currentDir, "aggregated.json");
    if (!fs.existsSync(aggregatedPath)) {
      // Scaffolded candidate without a published analysis yet.
      continue;
    }

    const versionMetaPath = path.join(currentDir, "metadata.json");
    let versionDate = "";
    if (fs.existsSync(versionMetaPath)) {
      try {
        const vm = readJson<{ version_date?: string }>(versionMetaPath);
        if (typeof vm.version_date === "string") versionDate = vm.version_date;
      } catch {
        /* ignore — loadCandidate will surface the error */
      }
    }

    const availableLocales = discoverAvailableLocales(currentDir);

    entries.push({
      id: meta.id,
      displayName: meta.display_name,
      party: meta.party,
      partyId: meta.party_id,
      isFictional: meta.is_fictional === true,
      versionDate,
      updatedAt: meta.updated,
      availableLocales,
    });
  }

  return entries;
}

/**
 * Scan a candidate's `current/` directory for published translation
 * files (`aggregated.<lang>.json`). FR is always present implicitly
 * via the canonical `aggregated.json`.
 */
function discoverAvailableLocales(currentDir: string): Lang[] {
  const locales: Lang[] = ["fr"];
  if (!fs.existsSync(currentDir)) return locales;
  const re = /^aggregated\.([a-z]{2})\.json$/;
  for (const name of fs.readdirSync(currentDir)) {
    const m = re.exec(name);
    if (!m) continue;
    const code = m[1];
    if (code === "fr") continue;
    // Narrow to known Lang values; ignore unknown codes silently.
    if (code === "en" && !locales.includes("en")) {
      locales.push("en");
    }
  }
  return locales;
}

// ---------------------------------------------------------------------------
// loadCandidate
// ---------------------------------------------------------------------------

export function loadCandidate(
  id: string,
  lang: Lang = "fr",
): CandidateBundle {
  const root = resolveCandidatesDir();
  const candidateDir = path.join(root, id);
  if (!fs.existsSync(candidateDir)) {
    throw new CandidateDataError({
      id,
      path: candidateDir,
      message: "candidate directory not found",
    });
  }

  const metaPath = path.join(candidateDir, "metadata.json");
  const meta = parseOrThrow(metaPath, CandidateMetadataSchema, id);

  const currentDir = path.join(candidateDir, "current");
  const aggregatedPath = path.join(currentDir, "aggregated.json");
  if (!fs.existsSync(aggregatedPath)) {
    throw new CandidateDataError({
      id,
      path: aggregatedPath,
      message: "aggregated.json not found",
    });
  }
  const aggregatedFr = parseOrThrow(
    aggregatedPath,
    AggregatedOutputSchema,
    id,
  );

  const versionMetaPath = path.join(currentDir, "metadata.json");
  // TODO(website): add a future task to make VersionMetadata validation
  // strict (currently best-effort in v1 — schema drift in version metadata
  // should be surfaced hard like aggregated.json). See
  // docs/specs/website/nextjs-architecture.md §2 "Schema validation".
  const versionMeta = parseOrThrow(
    versionMetaPath,
    VersionMetadataSchema,
    id,
  );

  const rawSummaries = buildRawSummaries(versionMeta);

  // FR (canonical): no translation lookup, no parity check.
  if (lang === "fr") {
    return {
      meta,
      versionMeta,
      aggregated: aggregatedFr,
      rawSummaries,
      translation: { lang: "fr", status: "native_fr" },
    };
  }

  // Non-FR: try to resolve the published translation; fall back to FR
  // canonical content when missing. See spec §4.1, §6.
  const translatedPath = path.join(currentDir, `aggregated.${lang}.json`);
  if (!fs.existsSync(translatedPath)) {
    return {
      meta,
      versionMeta,
      aggregated: aggregatedFr,
      rawSummaries,
      translation: { lang, status: "missing" },
    };
  }

  const aggregatedTr = parseOrThrow(
    translatedPath,
    AggregatedOutputSchema,
    id,
  );

  // Build-time WARNING (not an error): surface parity drift without
  // breaking the build. The CLI validator (`npm run validate-translation`)
  // is the gating check before publication.
  const issues = collectParityIssues(aggregatedFr, aggregatedTr);
  if (issues.length > 0) {
    console.warn(
      `[i18n] parity drift in ${id} (${lang}): ${issues.length} issue(s)`,
    );
    for (const issue of issues.slice(0, 10)) {
      console.warn(`  - [${issue.kind}] ${issue.path}: ${issue.message}`);
    }
    if (issues.length > 10) {
      console.warn(`  … and ${issues.length - 10} more`);
    }
  }

  return {
    meta,
    versionMeta,
    aggregated: aggregatedTr,
    rawSummaries,
    translation: { lang, status: "available" },
  };
}

function parseOrThrow<T>(
  filePath: string,
  schema: { parse: (d: unknown) => T },
  id: string,
): T {
  let raw: unknown;
  try {
    raw = readJson(filePath);
  } catch (err) {
    throw new CandidateDataError({
      id,
      path: filePath,
      message: `failed to read JSON: ${(err as Error).message}`,
    });
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new CandidateDataError({
        id,
        path: filePath,
        message: `schema validation failed (${err.issues.length} issue${err.issues.length === 1 ? "" : "s"})`,
        zodIssues: err.issues,
      });
    }
    throw err;
  }
}

function buildRawSummaries(versionMeta: VersionMetadata): RawModelSummary[] {
  const models = versionMeta.analysis?.models;
  if (!models) return [];
  return Object.entries(models).map(([modelId, entry]) => ({
    modelId,
    provider: entry.provider,
    exactVersion: entry.exact_version,
    promptSha256: versionMeta.analysis?.prompt_sha256 ?? "",
    status: entry.status,
    executionMode: entry.execution_mode,
  }));
}
