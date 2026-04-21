// See docs/specs/website/transparency.md §7 "Résultats IA tab"
//
// Editorial constraints (NON-NEGOTIABLE):
//   - Positioning rows render INTEGER TEXT only — no bars, no gradients,
//     no arithmetic means. Positioning is ordinal.
//   - Dissent is preserved row-by-row; every contested claim lists its
//     positions verbatim.
//   - Per-model raw JSON is rendered byte-for-byte via JSON.stringify —
//     never filtered, never summarized.
"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  AggregatedOutput,
  VersionMetadata,
} from "@/lib/schema";
import type {
  ResultsView,
  TransparencyHashState,
} from "@/lib/transparency-hash";
import { AXIS_KEYS } from "@/lib/derived/keys";
import { AXES } from "@/lib/anchors";
import { t } from "@/lib/i18n";

const VIEW_LABELS: Record<ResultsView, string> = {
  notes: "Notes d’agrégation",
  "per-model": "Sorties par modèle",
  agreement: "Accord / désaccord",
};

const VIEWS: readonly ResultsView[] = ["notes", "per-model", "agreement"];

export function ResultsTab({
  id,
  versionMeta,
  aggregated,
  state,
  onStateChange,
}: {
  id: string;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
  state: TransparencyHashState | null;
  onStateChange: (next: TransparencyHashState | null) => void;
}) {
  const view: ResultsView =
    state && state.tab === "results" ? (state.view ?? "notes") : "notes";

  const selectView = (next: ResultsView) => {
    onStateChange({ tab: "results", view: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Vues de résultats"
        className="flex flex-wrap gap-1 border-b border-rule"
      >
        {VIEWS.map((v) => {
          const selected = v === view;
          return (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => selectView(v)}
              className={
                "rounded-t-sm border-b-2 px-3 py-1.5 text-xs font-medium transition-colors " +
                (selected
                  ? "border-accent text-text"
                  : "border-transparent text-text-secondary hover:text-text")
              }
            >
              {VIEW_LABELS[v]}
            </button>
          );
        })}
      </div>
      {view === "notes" ? (
        <NotesView id={id} versionDate={versionMeta.version_date} />
      ) : null}
      {view === "per-model" ? (
        <PerModelView
          id={id}
          versionMeta={versionMeta}
          focusedModel={
            state && state.tab === "results" ? state.model : undefined
          }
          onFocusModel={(modelId) =>
            onStateChange({
              tab: "results",
              view: "per-model",
              model: modelId,
            })
          }
        />
      ) : null}
      {view === "agreement" ? (
        <AgreementMapView aggregated={aggregated} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotesView
// ---------------------------------------------------------------------------

export function NotesView({
  id,
  versionDate,
}: {
  id: string;
  versionDate: string;
}) {
  const url = `/candidates/${id}/${versionDate}/aggregation-notes.md`;
  const [state, setState] = React.useState<
    | { phase: "loading" }
    | { phase: "loaded"; body: string }
    | { phase: "error"; message: string }
  >({ phase: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((body) => {
        if (!cancelled) setState({ phase: "loaded", body });
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

  return <NotesViewBody state={state} url={url} />;
}

export function NotesViewBody({
  state,
  url,
}: {
  state:
    | { phase: "loading" }
    | { phase: "loaded"; body: string }
    | { phase: "error"; message: string };
  url: string;
}) {
  if (state.phase === "loading") {
    return (
      <p className="rounded-md border border-rule bg-bg-subtle px-4 py-4 text-xs text-text-tertiary">
        Chargement des notes d’agrégation…
      </p>
    );
  }
  if (state.phase === "error") {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        Échec du chargement ({state.message}).{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-dotted underline-offset-2"
        >
          Ouvrir le fichier brut
        </a>
        .
      </p>
    );
  }
  return (
    <article className="prose prose-sm max-w-none text-text [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-[13px] [&_p]:leading-relaxed [&_code]:rounded-sm [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.body}</ReactMarkdown>
    </article>
  );
}

// ---------------------------------------------------------------------------
// PerModelView
// ---------------------------------------------------------------------------

export function PerModelView({
  id,
  versionMeta,
  focusedModel,
  onFocusModel,
}: {
  id: string;
  versionMeta: VersionMetadata;
  focusedModel: string | undefined;
  onFocusModel: (modelId: string) => void;
}) {
  const models = versionMeta.analysis?.models ?? {};
  const entries = Object.entries(models);
  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-rule bg-bg-subtle px-4 py-4 text-xs text-text-secondary">
        Aucun modèle enregistré.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {entries.map(([modelId, entry]) => (
        <li key={modelId}>
          <ModelCard
            id={id}
            versionDate={versionMeta.version_date}
            modelId={modelId}
            entry={entry}
            expanded={modelId === focusedModel}
            onToggle={() => onFocusModel(modelId)}
          />
        </li>
      ))}
    </ul>
  );
}

function ModelCard({
  id,
  versionDate,
  modelId,
  entry,
  expanded,
  onToggle,
}: {
  id: string;
  versionDate: string;
  modelId: string;
  entry: NonNullable<VersionMetadata["analysis"]>["models"][string];
  expanded: boolean;
  onToggle: () => void;
}) {
  const failed = entry.status === "failed";
  const rawUrl = `/candidates/${id}/${versionDate}/raw-outputs/${encodeURIComponent(modelId)}.json`;
  const failedUrl = `/candidates/${id}/${versionDate}/raw-outputs/${encodeURIComponent(modelId)}.FAILED.json`;

  return (
    <section
      id={`model-${modelId}`}
      className={
        "rounded-md border bg-bg " +
        (expanded ? "border-accent" : "border-rule")
      }
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-sm text-text">{modelId}</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-text-tertiary">
            <span>{entry.provider}</span>
            <span className="font-mono">{entry.exact_version}</span>
            <StatusBadge status={entry.status} />
            <span>mode : {entry.execution_mode}</span>
            <span className="font-mono">run : {entry.run_at}</span>
            {entry.attested_by ? (
              <span>attesté par {entry.attested_by}</span>
            ) : null}
            {entry.attested_model_version ? (
              <span className="font-mono">
                version attestée : {entry.attested_model_version}
              </span>
            ) : null}
          </div>
          {entry.provider_metadata_available !== false ? (
            <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-text-tertiary">
              {typeof entry.tokens_in === "number" ? (
                <span>tokens in : {entry.tokens_in}</span>
              ) : null}
              {typeof entry.tokens_out === "number" ? (
                <span>tokens out : {entry.tokens_out}</span>
              ) : null}
              {typeof entry.cost_estimate_usd === "number" ? (
                <span>coût : ${entry.cost_estimate_usd.toFixed(4)}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 gap-2 text-xs">
          {failed ? (
            <a
              href={failedUrl}
              className="rounded-sm border border-rule px-2 py-1 hover:bg-bg-subtle"
            >
              Voir le rapport d’échec
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="rounded-sm border border-rule px-2 py-1 hover:bg-bg-subtle"
              >
                {expanded ? "Masquer" : "Voir le JSON brut"}
              </button>
              <a
                href={rawUrl}
                download={`${modelId}.json`}
                className="rounded-sm border border-rule px-2 py-1 hover:bg-bg-subtle"
              >
                Télécharger
              </a>
            </>
          )}
        </div>
      </header>
      {expanded && !failed ? (
        <div className="border-t border-rule px-4 py-3">
          <RawJsonViewer url={rawUrl} />
        </div>
      ) : null}
    </section>
  );
}

function RawJsonViewer({ url }: { url: string }) {
  const [state, setState] = React.useState<
    | { phase: "loading" }
    | { phase: "loaded"; body: string }
    | { phase: "error"; message: string }
  >({ phase: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((txt) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(txt);
          setState({
            phase: "loaded",
            body: JSON.stringify(parsed, null, 2),
          });
        } catch {
          setState({ phase: "loaded", body: txt });
        }
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

  if (state.phase === "loading")
    return <p className="text-xs text-text-tertiary">Chargement…</p>;
  if (state.phase === "error")
    return (
      <p className="text-xs text-text-tertiary">
        Échec du chargement : {state.message}
      </p>
    );
  return (
    <pre className="max-h-[500px] overflow-auto rounded-sm border border-rule bg-bg-subtle p-3 text-[11px] leading-snug text-text">
      {state.body}
    </pre>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : status === "failed"
        ? "border-rose-400 bg-rose-50 text-rose-900"
        : "border-rule bg-bg-subtle text-text-secondary";
  return (
    <span
      className={
        "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
        cls
      }
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AgreementMapView
// ---------------------------------------------------------------------------

export function AgreementMapView({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const map = aggregated.agreement_map;
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Consensus — {map.high_confidence_claims.length} affirmations
        </h3>
        {map.high_confidence_claims.length === 0 ? (
          <p className="text-xs text-text-tertiary">Aucune affirmation consensuelle.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {map.high_confidence_claims.map((c) => (
              <li
                key={c.claim_id}
                id={`claim-${c.claim_id}`}
                className="rounded-md border border-rule bg-bg px-3 py-2"
              >
                <div className="font-mono text-xs text-text">{c.claim_id}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.models.map((m) => (
                    <ModelBadge key={m} modelId={m} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Désaccords — {map.contested_claims.length} affirmations
        </h3>
        {map.contested_claims.length === 0 ? (
          <p className="text-xs text-text-tertiary">Aucun désaccord.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {map.contested_claims.map((c) => (
              <li
                key={c.claim_id}
                id={`claim-${c.claim_id}`}
                className="rounded-md border border-rule bg-bg px-3 py-2"
              >
                <div className="font-mono text-xs text-text">{c.claim_id}</div>
                <ul className="mt-2 flex flex-col gap-1.5 text-xs">
                  {c.positions.map((p, idx) => (
                    <li
                      key={p.model + "-" + idx}
                      className="flex flex-wrap items-baseline gap-2"
                    >
                      <ModelBadge modelId={p.model} />
                      <span className="text-text">{p.position}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-positioning-consensus="">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Positionnement agrégé
        </h3>
        <p className="mb-3 text-[11px] text-text-tertiary">
          Valeurs entières ordinales. Aucune moyenne arithmétique n’est
          calculée — voir la spec §7.
        </p>
        <ul className="flex flex-col gap-2">
          {AXIS_KEYS.map((axisKey) => {
            const row = map.positioning_consensus[axisKey];
            if (!row) return null;
            const axisMeta = AXES.find((a) => a.axis === axisKey);
            const label = axisMeta ? t(axisMeta.label, "fr") : axisKey;
            const [lo, hi] = row.interval;
            return (
              <li
                key={axisKey}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-baseline gap-x-3 gap-y-0.5 rounded-md border border-rule bg-bg px-3 py-2 text-xs"
              >
                <span className="font-medium text-text">{label}</span>
                <span className="font-mono text-text-tertiary">
                  intervalle : [{formatInt(lo)}, {formatInt(hi)}]
                </span>
                <span className="font-mono text-text">
                  modal : {row.modal === null ? "∅" : formatInt(row.modal)}
                </span>
                <span className="text-text-tertiary">
                  désaccords : {row.dissent_count}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ModelBadge({ modelId }: { modelId: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rule bg-bg-subtle px-2 py-0.5 font-mono text-[10px] text-text-secondary">
      {modelId}
    </span>
  );
}

function formatInt(n: number): string {
  // Preserve sign explicitly so -3 renders as "−3" (typographic minus)
  // and 0 as "0" — integer text only.
  if (n === 0) return "0";
  if (n < 0) return `−${Math.abs(n)}`;
  return `+${n}`;
}
