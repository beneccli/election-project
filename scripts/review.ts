#!/usr/bin/env tsx
/**
 * Stage 4.5: Human review of `aggregated.draft.json` — the last editorial
 * gate before publication.
 *
 * See docs/specs/analysis/aggregation.md "Human review queue" and
 * docs/specs/data-pipeline/overview.md.
 *
 * Behavior summary:
 * - Iterates over `flagged_for_review[]` in the draft aggregated output.
 * - For each unresolved item, the reviewer chooses
 *   [a]pprove / [r]eject / [e]dit / [s]kip / [q]uit.
 * - Decisions are recorded on the flagged item itself via the
 *   `resolution` / `reviewed_at` / `reviewer_id` / `human_edit` /
 *   `edited_text` fields (see scripts/lib/schema.ts FlaggedForReviewSchema).
 *   This keeps the transparency trail explicit in the final output rather
 *   than silently merging approved claims into aggregated sections — any
 *   reader can see which flagged items were approved, rejected, edited,
 *   or left unresolved.
 * - `aggregated.json` is only produced when every flagged item is resolved
 *   (approved/rejected/edited). Any remaining `skipped` item blocks the
 *   final write and exits non-zero.
 * - `aggregation.human_review_completed` in `metadata.json` is only set to
 *   `true` when `aggregated.json` is written.
 *
 * The review loop is exposed as a pure function (`reviewLoop`) so unit
 * tests can drive it with a stubbed prompter — no real editor or stdin is
 * launched in tests.
 */
import { Command } from "commander";
import { readFile, writeFile, unlink, mkdtemp } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLogger } from "./lib/logger";
import { versionDir, pathExists } from "./lib/paths";
import {
  AggregatedOutputSchema,
  VersionMetadataSchema,
  type AggregatedOutput,
  type VersionMetadata,
} from "./lib/schema";
import { validateAndWrite, validateOrThrow } from "./lib/validate";

const log = createLogger({ script: "review" });

export type Resolution = "approved" | "rejected" | "edited" | "skipped";

export type FlaggedItem = AggregatedOutput["flagged_for_review"][number];

export type ReviewChoice = "a" | "r" | "e" | "s" | "q";

export interface Prompter {
  /** Ask the reviewer a question; return the single-character choice. */
  ask(item: FlaggedItem, sourcesExcerpt: string): Promise<ReviewChoice>;
  /** Open an editor pre-populated with `initial`; return the edited text. */
  edit(initial: string): Promise<string>;
}

export interface ReviewLoopResult {
  items: FlaggedItem[];
  quitEarly: boolean;
}

export interface ReviewLoopOptions {
  items: FlaggedItem[];
  prompter: Prompter;
  reviewerId: string;
  now: () => string;
  sources: string;
}

/**
 * Pure review loop — operates on flagged items and returns the updated list.
 *
 * Preserves any existing `resolution` on an item (idempotent re-run after a
 * quit): items with a terminal resolution (approved/rejected/edited) are not
 * re-prompted. Items with `skipped` ARE re-prompted — a previous `skipped`
 * just means the reviewer deferred that decision.
 */
export async function reviewLoop(
  opts: ReviewLoopOptions,
): Promise<ReviewLoopResult> {
  const { items, prompter, reviewerId, now, sources } = opts;
  const out: FlaggedItem[] = items.map((it) => ({ ...it }));

  for (let i = 0; i < out.length; i++) {
    const current = out[i];
    const terminal: Resolution[] = ["approved", "rejected", "edited"];
    if (current.resolution && terminal.includes(current.resolution as Resolution)) {
      continue;
    }

    const excerpt = findExcerpt(sources, current.claim);
    const choice = await prompter.ask(current, excerpt);

    switch (choice) {
      case "a":
        out[i] = {
          ...current,
          resolution: "approved",
          reviewed_at: now(),
          reviewer_id: reviewerId,
        };
        break;
      case "r":
        out[i] = {
          ...current,
          resolution: "rejected",
          reviewed_at: now(),
          reviewer_id: reviewerId,
        };
        break;
      case "e": {
        const edited = await prompter.edit(current.claim);
        out[i] = {
          ...current,
          resolution: "edited",
          human_edit: true,
          edited_text: edited,
          reviewed_at: now(),
          reviewer_id: reviewerId,
        };
        break;
      }
      case "s":
        out[i] = {
          ...current,
          resolution: "skipped",
          reviewed_at: now(),
          reviewer_id: reviewerId,
        };
        break;
      case "q":
        return { items: out, quitEarly: true };
    }
  }

  return { items: out, quitEarly: false };
}

/**
 * Find a short excerpt from `sources.md` that overlaps the claim's
 * keywords. Intentionally simple — the goal is to give the reviewer
 * context, not to perform semantic search.
 */
export function findExcerpt(sources: string, claim: string): string {
  if (!sources) return "(sources.md not available)";
  // Pick the longest word in the claim (likely the most informative).
  const keywords = claim
    .split(/\W+/)
    .filter((w) => w.length >= 6)
    .sort((a, b) => b.length - a.length);
  for (const kw of keywords.slice(0, 5)) {
    const idx = sources.toLowerCase().indexOf(kw.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 120);
      const end = Math.min(sources.length, idx + 120);
      return `…${sources.slice(start, end).trim()}…`;
    }
  }
  return "(no matching excerpt found in sources.md)";
}

/** Returns true iff every flagged item has a terminal resolution. */
export function allResolved(items: FlaggedItem[]): boolean {
  const terminal: Resolution[] = ["approved", "rejected", "edited"];
  return items.every(
    (it) => it.resolution && terminal.includes(it.resolution as Resolution),
  );
}

export interface ReviewOptions {
  candidate: string;
  version: string;
  reviewer?: string;
  prompter?: Prompter;
}

export interface ReviewSummary {
  quitEarly: boolean;
  finalWritten: boolean;
  counts: Record<Resolution | "unresolved", number>;
}

/** CLI entry — reads filesystem state, drives the review loop, writes back. */
export async function review(opts: ReviewOptions): Promise<ReviewSummary> {
  const { candidate, version } = opts;
  const verDir = versionDir(candidate, version);
  const draftPath = join(verDir, "aggregated.draft.json");
  const finalPath = join(verDir, "aggregated.json");
  const sourcesPath = join(verDir, "sources.md");
  const metadataPath = join(verDir, "metadata.json");
  const notesPath = join(verDir, "aggregation-notes.md");

  if (!(await pathExists(draftPath))) {
    throw new Error(
      `aggregated.draft.json not found at ${draftPath}. Run aggregate first.`,
    );
  }

  const draft = validateOrThrow(
    AggregatedOutputSchema,
    JSON.parse(await readFile(draftPath, "utf-8")),
    draftPath,
  );

  const sources = await readFile(sourcesPath, "utf-8").catch(() => "");
  const reviewerId = opts.reviewer ?? (await resolveReviewer());
  const prompter = opts.prompter ?? createReadlinePrompter();

  log.info(
    { candidate, version, flaggedCount: draft.flagged_for_review.length },
    "Starting review",
  );

  const { items, quitEarly } = await reviewLoop({
    items: draft.flagged_for_review,
    prompter,
    reviewerId,
    now: () => new Date().toISOString(),
    sources,
  });

  const updatedDraft: AggregatedOutput = {
    ...draft,
    flagged_for_review: items,
  };

  // Always persist progress to the draft so `q` is recoverable.
  await validateAndWrite(AggregatedOutputSchema, updatedDraft, draftPath);

  const counts = countResolutions(items);
  const summary: ReviewSummary = {
    quitEarly,
    finalWritten: false,
    counts,
  };

  if (quitEarly) {
    log.info({ counts }, "Review exited early — draft updated, final not produced");
    return summary;
  }

  if (counts.skipped > 0 || counts.unresolved > 0) {
    log.error(
      { counts },
      "Cannot write aggregated.json with skipped/unresolved items",
    );
    return summary;
  }

  // Promote draft to final.
  await validateAndWrite(AggregatedOutputSchema, updatedDraft, finalPath);
  log.info({ path: finalPath }, "aggregated.json written");

  // Append resolution notes.
  await appendResolutionNotes(notesPath, items);

  // Flip the publish gate.
  const metadata = validateOrThrow(
    VersionMetadataSchema,
    JSON.parse(await readFile(metadataPath, "utf-8")),
    metadataPath,
  );
  const updatedMetadata: VersionMetadata = {
    ...metadata,
    aggregation: {
      ...metadata.aggregation!,
      human_review_completed: true,
      reviewer: reviewerId,
      reviewed_at: new Date().toISOString(),
    },
  };
  await validateAndWrite(VersionMetadataSchema, updatedMetadata, metadataPath);

  summary.finalWritten = true;
  log.info({ counts }, "Review complete");
  return summary;
}

function countResolutions(
  items: FlaggedItem[],
): Record<Resolution | "unresolved", number> {
  const counts: Record<Resolution | "unresolved", number> = {
    approved: 0,
    rejected: 0,
    edited: 0,
    skipped: 0,
    unresolved: 0,
  };
  for (const it of items) {
    if (!it.resolution) counts.unresolved++;
    else counts[it.resolution as Resolution]++;
  }
  return counts;
}

async function appendResolutionNotes(
  notesPath: string,
  items: FlaggedItem[],
): Promise<void> {
  const existing = await readFile(notesPath, "utf-8").catch(() => "");
  const lines: string[] = [""];
  lines.push("## Flagged item resolutions");
  lines.push("");
  for (const it of items) {
    lines.push(
      `- **${it.resolution}** — ${it.claim} (reviewer: ${it.reviewer_id ?? "n/a"}, at: ${it.reviewed_at ?? "n/a"})`,
    );
    if (it.resolution === "edited" && it.edited_text) {
      lines.push(`  - Edited to: ${it.edited_text}`);
    }
  }
  lines.push("");
  await writeFile(notesPath, existing + lines.join("\n"), "utf-8");
}

async function resolveReviewer(): Promise<string> {
  // Best-effort read of `git config user.email`; fall back to $USER.
  return new Promise((resolvePromise) => {
    const proc = spawn("git", ["config", "user.email"], { stdio: "pipe" });
    let out = "";
    proc.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    proc.on("close", () => {
      const email = out.trim();
      resolvePromise(email || process.env.USER || "unknown-reviewer");
    });
    proc.on("error", () => {
      resolvePromise(process.env.USER || "unknown-reviewer");
    });
  });
}

function createReadlinePrompter(): Prompter {
  const rl = createInterface({ input, output });
  return {
    async ask(item, sourcesExcerpt) {
      output.write("\n---\n");
      output.write(`Claim:            ${item.claim}\n`);
      output.write(`Claimed by:       ${item.claimed_by.join(", ")}\n`);
      output.write(`Issue:            ${item.issue}\n`);
      output.write(`Suggested action: ${item.suggested_action}\n`);
      output.write(`\nsources.md excerpt:\n${sourcesExcerpt}\n`);
      for (;;) {
        const ans = (
          await rl.question("\n[a]pprove / [r]eject / [e]dit / [s]kip / [q]uit > ")
        )
          .trim()
          .toLowerCase();
        if (["a", "r", "e", "s", "q"].includes(ans)) {
          return ans as ReviewChoice;
        }
        output.write(`Unrecognized choice: "${ans}". Please enter a, r, e, s, or q.\n`);
      }
    },
    async edit(initial) {
      const dir = await mkdtemp(join(tmpdir(), "review-edit-"));
      const tmpPath = join(dir, "claim.txt");
      await writeFile(tmpPath, initial, "utf-8");
      await new Promise<void>((resolvePromise, reject) => {
        const editor = process.env.EDITOR ?? "vi";
        const proc = spawn(editor, [tmpPath], { stdio: "inherit" });
        proc.on("close", (code) => {
          if (code === 0) resolvePromise();
          else reject(new Error(`${editor} exited with code ${code}`));
        });
      });
      const edited = (await readFile(tmpPath, "utf-8")).trim();
      await unlink(tmpPath).catch(() => {});
      return edited;
    },
  };
}

// CLI
const program = new Command();
program
  .name("review")
  .description("Human review of aggregated.draft.json flagged items")
  .requiredOption("--candidate <id>", "Candidate ID")
  .requiredOption("--version <date>", "Version date (YYYY-MM-DD)")
  .option("--reviewer <id>", "Reviewer identifier (defaults to git user.email)")
  .action(async (cliOpts) => {
    try {
      const result = await review({
        candidate: cliOpts.candidate,
        version: cliOpts.version,
        reviewer: cliOpts.reviewer,
      });
      if (!result.finalWritten) {
        process.exitCode = 1;
      }
    } catch (err) {
      log.error({ err: (err as Error).message }, "Review failed");
      process.exitCode = 1;
    }
  });

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/review.ts") ||
    process.argv[1].endsWith("/review.js"));

if (isDirectRun) {
  program.parse(process.argv);
}
