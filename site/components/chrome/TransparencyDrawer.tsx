// See docs/specs/website/transparency.md §3 "Drawer anatomy", §7 "Coverage warnings", §8 "Deep-linking"
"use client";
import * as React from "react";
import { Drawer } from "./Drawer";
import type { AggregatedOutput, VersionMetadata } from "@/lib/schema";
import {
  formatTransparencyHash,
  type TransparencyHashState,
  type TransparencyTab,
} from "@/lib/transparency-hash";
import { useTransparencyHash } from "@/lib/use-transparency-hash";

const TAB_ORDER: readonly TransparencyTab[] = [
  "sources",
  "document",
  "prompts",
  "results",
];

const TAB_LABELS: Record<TransparencyTab, string> = {
  sources: "Sources",
  document: "Document consolidé",
  prompts: "Prompts",
  results: "Résultats IA",
};

// ---------------------------------------------------------------------------
// Pure chrome — state is lifted so SSR/unit tests can drive the component
// without a browser `hashchange` event loop.
// ---------------------------------------------------------------------------

export function TransparencyDrawerChrome({
  versionMeta,
  aggregated,
  state,
  onStateChange,
}: {
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
  state: TransparencyHashState | null;
  onStateChange: (next: TransparencyHashState | null) => void;
}) {
  const tab: TransparencyTab = state?.tab ?? "sources";
  const open = state !== null;
  const tabRefs = React.useRef<Record<TransparencyTab, HTMLButtonElement | null>>(
    { sources: null, document: null, prompts: null, results: null },
  );

  const selectTab = React.useCallback(
    (next: TransparencyTab) => {
      onStateChange({ tab: next } as TransparencyHashState);
    },
    [onStateChange],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TAB_ORDER.indexOf(tab);
    let nextIdx: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        nextIdx = (idx + 1) % TAB_ORDER.length;
        break;
      case "ArrowLeft":
        nextIdx = (idx - 1 + TAB_ORDER.length) % TAB_ORDER.length;
        break;
      case "Home":
        nextIdx = 0;
        break;
      case "End":
        nextIdx = TAB_ORDER.length - 1;
        break;
    }
    if (nextIdx !== null) {
      event.preventDefault();
      const nextTab = TAB_ORDER[nextIdx]!;
      selectTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => onStateChange(next ? state ?? { tab: "sources" } : null)}
      eyebrow="Transparence"
      title={
        TAB_LABELS[tab] + " — " + (versionMeta.version_date ?? "")
      }
      description="Toutes les pièces justificatives de cette analyse."
      size="xl"
    >
      <WarningRibbons
        coverageWarning={aggregated.coverage_warning}
        humanReviewCompleted={
          versionMeta.aggregation?.human_review_completed ?? false
        }
      />
      <SummaryRow versionMeta={versionMeta} aggregated={aggregated} />
      <div
        role="tablist"
        aria-label="Sections de transparence"
        onKeyDown={onKeyDown}
        className="mt-6 flex flex-wrap gap-1 border-b border-rule"
      >
        {TAB_ORDER.map((t) => {
          const selected = t === tab;
          return (
            <button
              key={t}
              ref={(el) => {
                tabRefs.current[t] = el;
              }}
              role="tab"
              type="button"
              id={`transparency-tab-${t}`}
              aria-selected={selected}
              aria-controls={`transparency-panel-${t}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(t)}
              className={
                "rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
                (selected
                  ? "border-accent text-text"
                  : "border-transparent text-text-secondary hover:text-text")
              }
            >
              {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>
      <div className="pt-6">
        {TAB_ORDER.map((t) => {
          const selected = t === tab;
          return (
            <div
              key={t}
              role="tabpanel"
              id={`transparency-panel-${t}`}
              aria-labelledby={`transparency-tab-${t}`}
              hidden={!selected}
              className="text-sm text-text-secondary"
            >
              <TabPlaceholder tab={t} />
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Default export wired to the hash fragment.
// ---------------------------------------------------------------------------

export function TransparencyDrawer({
  id: _id,
  versionMeta,
  aggregated,
}: {
  id: string;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
}) {
  const [state, setState] = useTransparencyHash();
  return (
    <TransparencyDrawerChrome
      versionMeta={versionMeta}
      aggregated={aggregated}
      state={state}
      onStateChange={setState}
    />
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function WarningRibbons({
  coverageWarning,
  humanReviewCompleted,
}: {
  coverageWarning: boolean;
  humanReviewCompleted: boolean;
}) {
  if (!coverageWarning && humanReviewCompleted) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      {coverageWarning ? (
        <Ribbon
          tone="warn"
          label="Couverture partielle"
          detail="Moins de trois modèles ont analysé ce programme avec succès — les désaccords et consensus sont donc établis sur une base réduite."
        />
      ) : null}
      {!humanReviewCompleted ? (
        <Ribbon
          tone="warn"
          label="Revue humaine non complétée"
          detail="Cette version n’a pas encore été validée par un relecteur humain."
        />
      ) : null}
    </div>
  );
}

function Ribbon({
  tone,
  label,
  detail,
}: {
  tone: "warn";
  label: string;
  detail: string;
}) {
  const cls =
    tone === "warn"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-rule bg-bg-subtle text-text";
  return (
    <div
      role="status"
      className={`flex flex-col gap-1 rounded-md border px-3 py-2 text-xs ${cls}`}
    >
      <span className="font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-[11.5px] leading-snug">{detail}</span>
    </div>
  );
}

function SummaryRow({
  versionMeta,
  aggregated,
}: {
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
}) {
  const modelCount = Object.keys(versionMeta.analysis?.models ?? {}).length;
  const items: Array<{ label: string; value: string }> = [
    { label: "Version", value: versionMeta.version_date },
    { label: "Schéma", value: aggregated.schema_version },
    { label: "Modèles", value: String(modelCount) },
    {
      label: "Agrégation",
      value:
        versionMeta.aggregation?.aggregator_model.exact_version ?? "—",
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-md border border-rule bg-bg-subtle px-4 py-3 text-xs sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
            {it.label}
          </dt>
          <dd className="truncate font-mono text-text">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TabPlaceholder({ tab }: { tab: TransparencyTab }) {
  const taskByTab: Record<TransparencyTab, string> = {
    sources: "0093",
    document: "0094",
    prompts: "0095",
    results: "0096",
  };
  return (
    <p className="rounded-md border border-dashed border-rule px-4 py-8 text-center text-text-tertiary">
      À implémenter — task {taskByTab[tab]}
    </p>
  );
}

// Re-export for call sites that want to pre-compute an initial fragment.
export { formatTransparencyHash };
