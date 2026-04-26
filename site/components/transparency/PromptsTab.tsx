// See docs/specs/website/transparency.md §6 "Prompts tab"
"use client";
import * as React from "react";
import type { VersionMetadata } from "@/lib/schema";
import { githubHistoryUrl } from "@/lib/config";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/lang-context";

type PromptRole = "consolidation" | "analysis" | "aggregation";

export type PromptCardInput = {
  role: PromptRole;
  label: string;
  promptFile: string;
  promptVersion?: string;
  promptSha256: string;
};

type FetchState =
  | { phase: "loading" }
  | { phase: "match"; body: string; computedSha256: string }
  | { phase: "missing"; status: number }
  | { phase: "error"; message: string };

export function PromptsTab({
  versionMeta,
  highlightedSha,
}: {
  versionMeta: VersionMetadata;
  highlightedSha: string | undefined;
}) {
  const { lang } = useLang();
  const cards = buildCards(versionMeta, lang);
  if (cards.length === 0) {
    return (
      <p className="rounded-md border border-rule bg-bg-subtle px-4 py-6 text-sm text-text-secondary">
        {t(UI_STRINGS.PROMPTS_NONE, lang)}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {cards.map((card) => (
        <PromptCard
          key={card.role + "-" + card.promptSha256}
          card={card}
          highlighted={card.promptSha256 === highlightedSha}
          lang={lang}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export function buildCards(versionMeta: VersionMetadata, lang: Lang = "fr"): PromptCardInput[] {
  const out: PromptCardInput[] = [];
  const consolidation = versionMeta.sources;
  if (consolidation?.consolidation_prompt_sha256) {
    out.push({
      role: "consolidation",
      label: t(UI_STRINGS.PROMPTS_CONSOLIDATION_LABEL, lang),
      // The schema does not record a consolidation prompt *file* yet
      // (only method + sha + version). The canonical location in the
      // repo is stable; fall back to it until the schema carries the
      // path explicitly.
      promptFile: "prompts/consolidate-sources.md",
      promptVersion: consolidation.consolidation_prompt_version,
      promptSha256: consolidation.consolidation_prompt_sha256,
    });
  }
  if (versionMeta.analysis) {
    out.push({
      role: "analysis",
      label: t(UI_STRINGS.PROMPTS_ANALYSIS_LABEL, lang),
      promptFile: versionMeta.analysis.prompt_file,
      promptVersion: versionMeta.analysis.prompt_version,
      promptSha256: versionMeta.analysis.prompt_sha256,
    });
  }
  if (versionMeta.aggregation) {
    out.push({
      role: "aggregation",
      label: t(UI_STRINGS.PROMPTS_AGGREGATION_LABEL, lang),
      promptFile: versionMeta.aggregation.prompt_file,
      promptVersion: versionMeta.aggregation.prompt_version,
      promptSha256: versionMeta.aggregation.prompt_sha256,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function PromptCard({
  card,
  highlighted,
  lang,
}: {
  card: PromptCardInput;
  highlighted: boolean;
  lang: Lang;
}) {
  const [state, setState] = React.useState<FetchState>({ phase: "loading" });
  const ref = React.useRef<HTMLElement>(null);
  const url = `/prompts/${card.promptSha256}.md`;

  React.useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setState({ phase: "missing", status: 404 });
          return;
        }
        if (!r.ok) {
          if (!cancelled)
            setState({ phase: "missing", status: r.status });
          return;
        }
        const buf = await r.arrayBuffer();
        const body = new TextDecoder("utf-8").decode(buf);
        const computed = await sha256Hex(buf);
        if (!cancelled)
          setState({ phase: "match", body, computedSha256: computed });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : String(err),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  React.useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlighted]);

  return (
    <PromptCardView
      ref={ref}
      card={card}
      state={state}
      highlighted={highlighted}
      lang={lang}
    />
  );
}

export const PromptCardView = React.forwardRef<
  HTMLElement,
  {
    card: PromptCardInput;
    state: FetchState;
    highlighted: boolean;
    lang?: Lang;
  }
>(function PromptCardView({ card, state, highlighted, lang = "fr" }, ref) {
  const cls =
    "rounded-md border bg-bg " +
    (highlighted
      ? "border-accent shadow-[0_0_0_2px_rgba(244,114,22,0.15)]"
      : "border-rule");
  return (
    <section ref={ref} id={`prompt-${card.promptSha256}`} className={cls}>
      <header className="border-b border-rule px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
              {card.label}
            </div>
            <div className="mt-0.5 font-mono text-sm text-text">
              {card.promptFile}
              {card.promptVersion ? (
                <span className="ml-2 text-text-secondary">
                  · v{card.promptVersion}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-2 break-all font-mono text-[10.5px] text-text-secondary">
          {t(UI_STRINGS.PROMPTS_SHA256_LABEL, lang)} <span className="text-text">{card.promptSha256}</span>
        </div>
      </header>
      <div className="px-4 py-3">
        <PromptBody card={card} state={state} lang={lang} />
      </div>
    </section>
  );
});

function PromptBody({
  card,
  state,
  lang,
}: {
  card: PromptCardInput;
  state: FetchState;
  lang: Lang;
}) {
  if (state.phase === "loading") {
    return <p className="text-xs text-text-tertiary">{t(UI_STRINGS.RESULTS_LOADING_INLINE, lang)}</p>;
  }
  if (state.phase === "missing") {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <span className="font-semibold uppercase tracking-wider">
            {t(UI_STRINGS.PROMPTS_UNAVAILABLE_TITLE, lang)}
          </span>
          <p className="mt-1 text-[11.5px] leading-snug">
            {format(t(UI_STRINGS.PROMPTS_UNAVAILABLE_BODY, lang), { file: card.promptFile })}
          </p>
        </div>
        <a
          href={githubHistoryUrl(card.promptFile)}
          target="_blank"
          rel="noreferrer noopener"
          className="self-start text-xs underline decoration-dotted underline-offset-2"
        >
          {format(t(UI_STRINGS.PROMPTS_GIT_HISTORY, lang), { file: card.promptFile })}
        </a>
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <p className="text-xs text-text-tertiary">
        {format(t(UI_STRINGS.RESULTS_LOADING_FAILED_INLINE, lang), { message: state.message })}
      </p>
    );
  }
  const digestOk = state.computedSha256 === card.promptSha256;
  return (
    <div className="flex flex-col gap-2">
      {digestOk ? null : (
        <div className="rounded-sm border border-rose-400 bg-rose-50 px-3 py-2 text-xs text-rose-950">
          <span className="font-semibold uppercase tracking-wider">
            {t(UI_STRINGS.PROMPTS_HASH_MISMATCH_TITLE, lang)}
          </span>
          <p className="mt-1 font-mono text-[11px] leading-snug">
            {format(t(UI_STRINGS.PROMPTS_EXPECTED_HASH, lang), { hash: card.promptSha256 })}
            <br />
            {format(t(UI_STRINGS.PROMPTS_COMPUTED_HASH, lang), { hash: state.computedSha256 })}
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <CopyButton text={state.body} lang={lang} />
        <a
          href={`/prompts/${card.promptSha256}.md`}
          download={`${card.promptFile.replace(/^.*\//, "")}.${card.promptSha256.slice(0, 7)}.md`}
          className="rounded-sm border border-rule px-2 py-1 text-xs hover:bg-bg-subtle"
        >
          {t(UI_STRINGS.RESULTS_DOWNLOAD, lang)}
        </a>
      </div>
      <pre className="max-h-[500px] overflow-auto rounded-sm border border-rule bg-bg-subtle p-3 text-[11px] leading-snug text-text whitespace-pre-wrap">
        {state.body}
      </pre>
    </div>
  );
}

function CopyButton({ text, lang }: { text: string; lang: Lang }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded-sm border border-rule px-2 py-1 text-xs hover:bg-bg-subtle"
    >
      {copied ? t(UI_STRINGS.PROMPTS_COPIED, lang) : t(UI_STRINGS.PROMPTS_COPY, lang)}
    </button>
  );
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}
