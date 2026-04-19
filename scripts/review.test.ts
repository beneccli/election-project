import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { vi } from "vitest";

import {
  review,
  reviewLoop,
  allResolved,
  findExcerpt,
  type Prompter,
  type ReviewChoice,
  type FlaggedItem,
} from "./review";
import { buildValidAggregatedOutput } from "./lib/fixtures/aggregated-output/builder";
import * as pathsMod from "./lib/paths";

vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

class ScriptedPrompter implements Prompter {
  constructor(
    private readonly choices: ReviewChoice[],
    private readonly editText = "edited-claim-text",
  ) {}
  private i = 0;
  public asked: FlaggedItem[] = [];
  async ask(item: FlaggedItem): Promise<ReviewChoice> {
    this.asked.push(item);
    const c = this.choices[this.i++];
    if (!c) throw new Error("ScriptedPrompter ran out of choices");
    return c;
  }
  async edit(): Promise<string> {
    return this.editText;
  }
}

function makeFlaggedItem(overrides: Partial<FlaggedItem> = {}): FlaggedItem {
  return {
    claim: "Mesure d'ampleur non documentée par les sources.",
    claimed_by: ["claude-opus-4-0-20250514"],
    issue: "claim not supported by sources.md",
    suggested_action: "human review required",
    resolution: null,
    ...overrides,
  };
}

describe("review — pure helpers", () => {
  it("findExcerpt_returns_fallback_when_sources_empty", () => {
    expect(findExcerpt("", "any claim")).toBe("(sources.md not available)");
  });

  it("findExcerpt_returns_matching_snippet", () => {
    const sources = "# Sources\n\n## Retraites\nLe programme propose une nationalisation des autoroutes.";
    const excerpt = findExcerpt(sources, "nationalisation des autoroutes");
    expect(excerpt).toContain("nationalisation");
  });

  it("allResolved_true_only_when_all_terminal", () => {
    expect(
      allResolved([
        makeFlaggedItem({ resolution: "approved" }),
        makeFlaggedItem({ resolution: "rejected" }),
      ]),
    ).toBe(true);
    expect(
      allResolved([
        makeFlaggedItem({ resolution: "approved" }),
        makeFlaggedItem({ resolution: "skipped" }),
      ]),
    ).toBe(false);
    expect(allResolved([makeFlaggedItem({ resolution: null })])).toBe(false);
  });
});

describe("reviewLoop — decision semantics", () => {
  const now = () => "2026-04-19T12:00:00.000Z";
  const reviewerId = "test-reviewer@example.com";
  const sources = "irrelevant for pure loop";

  it("approve_sets_resolution_and_timestamp", async () => {
    const items = [makeFlaggedItem()];
    const prompter = new ScriptedPrompter(["a"]);
    const { items: out, quitEarly } = await reviewLoop({
      items,
      prompter,
      reviewerId,
      now,
      sources,
    });
    expect(quitEarly).toBe(false);
    expect(out[0].resolution).toBe("approved");
    expect(out[0].reviewer_id).toBe(reviewerId);
    expect(out[0].reviewed_at).toBe("2026-04-19T12:00:00.000Z");
  });

  it("reject_sets_rejected_resolution", async () => {
    const { items: out } = await reviewLoop({
      items: [makeFlaggedItem()],
      prompter: new ScriptedPrompter(["r"]),
      reviewerId,
      now,
      sources,
    });
    expect(out[0].resolution).toBe("rejected");
  });

  it("edit_sets_human_edit_flag_and_edited_text", async () => {
    const { items: out } = await reviewLoop({
      items: [makeFlaggedItem()],
      prompter: new ScriptedPrompter(["e"], "restated-measurement-text"),
      reviewerId,
      now,
      sources,
    });
    expect(out[0].resolution).toBe("edited");
    expect(out[0].human_edit).toBe(true);
    expect(out[0].edited_text).toBe("restated-measurement-text");
  });

  it("skip_sets_skipped_resolution", async () => {
    const { items: out } = await reviewLoop({
      items: [makeFlaggedItem()],
      prompter: new ScriptedPrompter(["s"]),
      reviewerId,
      now,
      sources,
    });
    expect(out[0].resolution).toBe("skipped");
  });

  it("quit_stops_loop_and_preserves_later_items", async () => {
    const items = [makeFlaggedItem({ claim: "first" }), makeFlaggedItem({ claim: "second" })];
    const prompter = new ScriptedPrompter(["q"]);
    const { items: out, quitEarly } = await reviewLoop({
      items,
      prompter,
      reviewerId,
      now,
      sources,
    });
    expect(quitEarly).toBe(true);
    expect(out[0].resolution).toBeFalsy();
    expect(out[1].resolution).toBeFalsy();
  });

  it("idempotent_rerun_skips_already_terminal_items", async () => {
    const items = [
      makeFlaggedItem({ resolution: "approved" }),
      makeFlaggedItem({ resolution: null }),
    ];
    const prompter = new ScriptedPrompter(["r"]);
    const { items: out } = await reviewLoop({
      items,
      prompter,
      reviewerId,
      now,
      sources,
    });
    expect(prompter.asked).toHaveLength(1);
    expect(out[0].resolution).toBe("approved");
    expect(out[1].resolution).toBe("rejected");
  });

  it("reruns_previously_skipped_items", async () => {
    const items = [makeFlaggedItem({ resolution: "skipped" })];
    const prompter = new ScriptedPrompter(["a"]);
    const { items: out } = await reviewLoop({
      items,
      prompter,
      reviewerId,
      now,
      sources,
    });
    expect(prompter.asked).toHaveLength(1);
    expect(out[0].resolution).toBe("approved");
  });
});

describe("review — end-to-end with filesystem", () => {
  let tmpDir: string;
  let verDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "review-test-"));
    verDir = join(tmpDir, "candidates", "test-candidate", "versions", "2026-04-19");
    await mkdir(verDir, { recursive: true });

    // Build a draft with one flagged item.
    const draft = buildValidAggregatedOutput();
    // Ensure at least one flagged_for_review item (the builder already has one).
    await writeFile(
      join(verDir, "aggregated.draft.json"),
      JSON.stringify(draft),
      "utf-8",
    );
    await writeFile(join(verDir, "sources.md"), "# Sources\nTest content.", "utf-8");
    await writeFile(join(verDir, "aggregation-notes.md"), "# Aggregation Notes\n", "utf-8");
    await writeFile(
      join(verDir, "metadata.json"),
      JSON.stringify({
        candidate_id: "test-candidate",
        version_date: "2026-04-19",
        schema_version: "1.0",
        aggregation: {
          prompt_file: "prompts/aggregate-analyses.md",
          prompt_sha256: "a".repeat(64),
          prompt_version: "1.0",
          aggregator_model: {
            provider: "anthropic",
            exact_version: "claude-opus-4-0-20250514",
            run_at: new Date().toISOString(),
            execution_mode: "api",
            provider_metadata_available: true,
          },
          human_review_completed: false,
        },
      }),
      "utf-8",
    );

    vi.spyOn(pathsMod, "versionDir").mockReturnValue(verDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  it("review_all_approved_writes_aggregated_json_and_flips_metadata", async () => {
    const result = await review({
      candidate: "test-candidate",
      version: "2026-04-19",
      reviewer: "tester@example.com",
      prompter: new ScriptedPrompter(["a"]),
    });
    expect(result.finalWritten).toBe(true);

    await access(join(verDir, "aggregated.json"));
    const meta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));
    expect(meta.aggregation.human_review_completed).toBe(true);
    expect(meta.aggregation.reviewer).toBe("tester@example.com");
    const notes = await readFile(join(verDir, "aggregation-notes.md"), "utf-8");
    expect(notes).toContain("Flagged item resolutions");
    expect(notes).toContain("**approved**");
  });

  it("review_with_skipped_refuses_to_write_final", async () => {
    const result = await review({
      candidate: "test-candidate",
      version: "2026-04-19",
      reviewer: "tester@example.com",
      prompter: new ScriptedPrompter(["s"]),
    });
    expect(result.finalWritten).toBe(false);
    expect(result.counts.skipped).toBe(1);
    await expect(access(join(verDir, "aggregated.json"))).rejects.toThrow();
    const meta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));
    expect(meta.aggregation.human_review_completed).toBe(false);
  });

  it("review_quit_preserves_partial_progress", async () => {
    const result = await review({
      candidate: "test-candidate",
      version: "2026-04-19",
      reviewer: "tester@example.com",
      prompter: new ScriptedPrompter(["q"]),
    });
    expect(result.quitEarly).toBe(true);
    expect(result.finalWritten).toBe(false);
    // Draft still exists; item still unresolved.
    const draft = JSON.parse(
      await readFile(join(verDir, "aggregated.draft.json"), "utf-8"),
    );
    expect(draft.flagged_for_review[0].resolution).toBeFalsy();
  });

  it("review_reject_keeps_flagged_entry_with_rejected_resolution", async () => {
    await review({
      candidate: "test-candidate",
      version: "2026-04-19",
      reviewer: "tester@example.com",
      prompter: new ScriptedPrompter(["r"]),
    });
    const finalAgg = JSON.parse(await readFile(join(verDir, "aggregated.json"), "utf-8"));
    expect(finalAgg.flagged_for_review[0].resolution).toBe("rejected");
  });

  it("review_edit_marks_human_edit_true_in_final", async () => {
    await review({
      candidate: "test-candidate",
      version: "2026-04-19",
      reviewer: "tester@example.com",
      prompter: new ScriptedPrompter(["e"], "restated as measurement"),
    });
    const finalAgg = JSON.parse(await readFile(join(verDir, "aggregated.json"), "utf-8"));
    expect(finalAgg.flagged_for_review[0].human_edit).toBe(true);
    expect(finalAgg.flagged_for_review[0].edited_text).toBe("restated as measurement");
  });

  it("review_throws_when_draft_missing", async () => {
    await rm(join(verDir, "aggregated.draft.json"));
    await expect(
      review({
        candidate: "test-candidate",
        version: "2026-04-19",
        reviewer: "tester@example.com",
        prompter: new ScriptedPrompter(["a"]),
      }),
    ).rejects.toThrow(/aggregated\.draft\.json not found/);
  });
});
