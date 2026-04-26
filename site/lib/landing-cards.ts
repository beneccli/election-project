// See docs/specs/website/landing-page.md §3.1, §4.2, §4.3
//
// Build-time view-model for the landing grid. Unlike `listCandidates()`
// which skips candidates lacking `aggregated.json`, this loader emits
// BOTH analyzed and pending rows (discriminated union). Cards are
// ordered by `updatedAt` desc, tie-broken by `displayName` asc.
//
// Editorial: no cardinal averaging, no ranking. `ecoAxis` is the
// economic axis modal (single ordinal), never a composite. Family
// bucketing is a public deterministic mapping shared by every
// candidate (see §4.3).

import fs from "node:fs";
import path from "node:path";
import {
  CandidateMetadataSchema,
  type CandidateMetadata,
} from "./schema";
import {
  CandidateDataError,
  loadCandidate,
  type CandidateBundle,
  type TranslationStatus,
} from "./candidates";
import { deriveComparisonProjection } from "./derived/comparison-projection";
import { AXIS_KEYS } from "./derived/keys";
import type { SpectrumStatus } from "./derived/spectrum-label";
import type {
  TopGradeLetter,
  GradeModifier,
} from "./derived/top-level-grade";
import type { Lang } from "./i18n";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LandingFamily = "gauche" | "centre" | "droite" | "ecologie";
export type LandingCardStatus = "analyzed" | "pending";

/** Fallback party-family colors (OKLCH CSS-variable tokens). */
export const FAMILY_DEFAULT_COLOR: Record<LandingFamily, string> = {
  gauche: "var(--family-gauche, oklch(0.62 0.16 25))",
  centre: "var(--family-centre, oklch(0.66 0.10 260))",
  droite: "var(--family-droite, oklch(0.58 0.14 240))",
  ecologie: "var(--family-ecologie, oklch(0.62 0.16 145))",
};

export interface LandingCardAnalyzed {
  id: string;
  status: "analyzed";
  displayName: string;
  party: string;
  partyShort: string;
  partyColor: string;
  family: LandingFamily | null;
  spectrumLabel: string | null;
  spectrumStatus: SpectrumStatus;
  overallGrade: TopGradeLetter;
  overallGradeModifier: GradeModifier;
  /** Economic-axis modal in [-5, +5] or null. */
  ecoAxis: number | null;
  /** Version folder date (YYYY-MM-DD). */
  versionDate: string;
  /** Root metadata `updated`. Used ONLY for ordering. */
  updatedAt: string;
  /** Number of successful per-model analyses underpinning the aggregate. */
  modelsCount: number;
  isFictional: boolean;
  /** Locale provenance for this card. When `status === "missing"`,
   *  the card uses FR fallback content and the UI renders an `FR`
   *  chip (see spec §6). */
  translation: TranslationStatus;
}

export interface LandingCardPending {
  id: string;
  status: "pending";
  displayName: string;
  party: string;
  partyShort: string;
  partyColor: string;
  family: LandingFamily | null;
  declaredDate: string | null;
  updatedAt: string;
  isFictional: boolean;
  /** Pending cards are language-agnostic (no aggregated content) but
   *  we surface translation provenance for symmetry with analyzed
   *  rows. Status is always "native_fr" for FR or "missing" for EN
   *  (no per-card translation file by definition). */
  translation: TranslationStatus;
}

export type LandingCard = LandingCardAnalyzed | LandingCardPending;

// ---------------------------------------------------------------------------
// Family bucketing (pure, deterministic)
// ---------------------------------------------------------------------------

type ModalSpectrumLabel =
  | "extreme_gauche"
  | "gauche"
  | "centre_gauche"
  | "centre"
  | "centre_droit"
  | "droite"
  | "extreme_droite"
  | "inclassable"
  | null;

/**
 * Map a spectrum status + modal label (+ optional override) to the
 * landing-page family bucket. Returns null when the candidate should
 * appear only under "Tous".
 *
 * Rule (see spec §4.3):
 * - `family_override === "ecologie"` wins.
 * - Else when status === "present", map the seven enum labels into
 *   {gauche, centre, droite}.
 * - Else (split / inclassable / absent) → null.
 */
export function deriveFamilyBucket(
  status: SpectrumStatus,
  modalLabel: ModalSpectrumLabel,
  familyOverride: "ecologie" | undefined,
): LandingFamily | null {
  if (familyOverride === "ecologie") return "ecologie";
  if (status !== "present") return null;
  switch (modalLabel) {
    case "extreme_gauche":
    case "gauche":
    case "centre_gauche":
      return "gauche";
    case "centre":
      return "centre";
    case "centre_droit":
    case "droite":
    case "extreme_droite":
      return "droite";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// partyShort helper (duplicated from comparison-projection.ts to keep
// the two surfaces independent; both are pure and identical).
// ---------------------------------------------------------------------------

function partyShort(party: string): string {
  const letters = party
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c): c is string => typeof c === "string" && /[A-Za-zÀ-ÿ]/.test(c))
    .join("")
    .toUpperCase();
  return letters.slice(0, 4) || party.slice(0, 3).toUpperCase();
}

// ---------------------------------------------------------------------------
// Filesystem helpers (mirror candidates.ts conventions)
// ---------------------------------------------------------------------------

function resolveCandidatesDir(): string {
  const override = process.env.CANDIDATES_DIR;
  if (override && override.length > 0) return path.resolve(override);
  return path.resolve(process.cwd(), "..", "candidates");
}

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

const ECONOMIC_AXIS_INDEX = AXIS_KEYS.indexOf("economic");

function countSuccessfulModels(bundle: CandidateBundle): number {
  const models = bundle.versionMeta.analysis?.models;
  if (!models) return 0;
  return Object.values(models).filter((m) => m.status === "success").length;
}

function buildAnalyzed(
  meta: CandidateMetadata,
  bundle: CandidateBundle,
): LandingCardAnalyzed {
  const projection = deriveComparisonProjection(bundle);
  const ecoAxis = projection.positioning[ECONOMIC_AXIS_INDEX] ?? null;
  const modalLabel =
    bundle.aggregated.positioning.overall_spectrum?.modal_label ?? null;
  const family = deriveFamilyBucket(
    projection.spectrumStatus,
    modalLabel,
    meta.family_override,
  );
  return {
    id: meta.id,
    status: "analyzed",
    displayName: meta.display_name,
    party: meta.party,
    partyShort: projection.partyShort,
    partyColor: family
      ? FAMILY_DEFAULT_COLOR[family]
      : FAMILY_DEFAULT_COLOR.centre,
    family,
    spectrumLabel: projection.spectrumLabelDisplay,
    spectrumStatus: projection.spectrumStatus,
    overallGrade: projection.overallGrade,
    overallGradeModifier: projection.overallGradeModifier,
    ecoAxis,
    versionDate: projection.versionDate,
    updatedAt: projection.updatedAt,
    modelsCount: countSuccessfulModels(bundle),
    isFictional: projection.isFictional,
    translation: bundle.translation,
  };
}

function buildPending(meta: CandidateMetadata, lang: Lang): LandingCardPending {
  const family = deriveFamilyBucket("absent", null, meta.family_override);
  const translation: TranslationStatus =
    lang === "fr"
      ? { lang: "fr", status: "native_fr" }
      : { lang, status: "missing" };
  return {
    id: meta.id,
    status: "pending",
    displayName: meta.display_name,
    party: meta.party,
    partyShort: partyShort(meta.party),
    partyColor: family
      ? FAMILY_DEFAULT_COLOR[family]
      : FAMILY_DEFAULT_COLOR.centre,
    family,
    declaredDate: meta.declared_candidate_date ?? null,
    updatedAt: meta.updated,
    isFictional: meta.is_fictional === true,
    translation,
  };
}

// ---------------------------------------------------------------------------
// listLandingCards
// ---------------------------------------------------------------------------

/**
 * Return one row per candidate folder. Candidates with a valid
 * `aggregated.json` become analyzed rows; candidates without (or with a
 * broken bundle) become pending rows. Never throws on a single broken
 * candidate — falls back to pending.
 *
 * Ordered by `updatedAt` desc, `displayName` asc tie-breaker.
 */
export function listLandingCards(lang: Lang = "fr"): LandingCard[] {
  const root = resolveCandidatesDir();
  if (!fs.existsSync(root)) return [];

  const excludeFictional = process.env.EXCLUDE_FICTIONAL === "1";
  const cards: LandingCard[] = [];

  for (const id of fs.readdirSync(root).sort()) {
    const candidateDir = path.join(root, id);
    if (!fs.statSync(candidateDir).isDirectory()) continue;

    const metaPath = path.join(candidateDir, "metadata.json");
    if (!fs.existsSync(metaPath)) continue;

    let meta: CandidateMetadata;
    try {
      meta = CandidateMetadataSchema.parse(readJson(metaPath));
    } catch {
      continue;
    }
    if (excludeFictional && meta.is_fictional === true) continue;

    const aggregatedPath = path.join(candidateDir, "current", "aggregated.json");
    if (!fs.existsSync(aggregatedPath)) {
      cards.push(buildPending(meta, lang));
      continue;
    }

    try {
      const bundle = loadCandidate(meta.id, lang);
      cards.push(buildAnalyzed(meta, bundle));
    } catch (err) {
      // Broken bundle → pending fallback. Never fail the build for one
      // candidate. See spec §3.1 "Safe-fallback".
      if (err instanceof CandidateDataError || err instanceof Error) {
        cards.push(buildPending(meta, lang));
        continue;
      }
      throw err;
    }
  }

  return sortLandingCards(cards);
}

export function sortLandingCards(cards: LandingCard[]): LandingCard[] {
  return [...cards].sort((a, b) => {
    if (a.updatedAt !== b.updatedAt) {
      return a.updatedAt < b.updatedAt ? 1 : -1;
    }
    return a.displayName.localeCompare(b.displayName, "fr");
  });
}
