// See docs/specs/website/nextjs-architecture.md §2
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
}

export interface RawModelSummary {
  modelId: string;
  provider: string;
  exactVersion: string;
  promptSha256: string;
  status: string;
  executionMode: string;
}

export interface CandidateBundle {
  meta: CandidateMetadata;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
  rawSummaries: RawModelSummary[];
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

    entries.push({
      id: meta.id,
      displayName: meta.display_name,
      party: meta.party,
      partyId: meta.party_id,
      isFictional: meta.is_fictional === true,
      versionDate,
      updatedAt: meta.updated,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// loadCandidate
// ---------------------------------------------------------------------------

export function loadCandidate(id: string): CandidateBundle {
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
  const aggregated = parseOrThrow(aggregatedPath, AggregatedOutputSchema, id);

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
  return { meta, versionMeta, aggregated, rawSummaries };
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
