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
import { SourcesTab } from "@/components/transparency/SourcesTab";
import { DocumentTab } from "@/components/transparency/DocumentTab";
import { PromptsTab } from "@/components/transparency/PromptsTab";
import { ResultsTab } from "@/components/transparency/ResultsTab";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

const TAB_ORDER: readonly TransparencyTab[] = [
  "sources",
  "document",
  "prompts",
  "results",
];

function tabLabel(tab: TransparencyTab, lang: Lang): string {
  switch (tab) {
    case "sources":
      return t(UI_STRINGS.TRANSPARENCY_TAB_SOURCES, lang);
    case "document":
      return t(UI_STRINGS.TRANSPARENCY_TAB_DOCUMENT, lang);
    case "prompts":
      return t(UI_STRINGS.TRANSPARENCY_TAB_PROMPTS, lang);
    case "results":
      return t(UI_STRINGS.TRANSPARENCY_TAB_RESULTS, lang);
  }
}

// ---------------------------------------------------------------------------
// Pure chrome — state is lifted so SSR/unit tests can drive the component
// without a browser `hashchange` event loop.
// ---------------------------------------------------------------------------

export function TransparencyDrawerChrome({
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
  const { lang } = useLang();
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
      eyebrow={t(UI_STRINGS.NAV_TRANSPARENCE, lang)}
      title={
        tabLabel(tab, lang) + " — " + (versionMeta.version_date ?? "")
      }
      description={t(UI_STRINGS.TRANSPARENCY_DRAWER_DESCRIPTION, lang)}
      size="xl"
    >
      <WarningRibbons
        coverageWarning={aggregated.coverage_warning}
        humanReviewCompleted={
          versionMeta.aggregation?.human_review_completed ?? false
        }
        lang={lang}
      />
      <SummaryRow versionMeta={versionMeta} aggregated={aggregated} lang={lang} />
      <div
        role="tablist"
        aria-label={t(UI_STRINGS.A11Y_TRANSPARENCY_TABS, lang)}
        onKeyDown={onKeyDown}
        className="mt-6 flex flex-wrap gap-1 border-b border-rule"
      >
        {TAB_ORDER.map((tb) => {
          const selected = tb === tab;
          return (
            <button
              key={tb}
              ref={(el) => {
                tabRefs.current[tb] = el;
              }}
              role="tab"
              type="button"
              id={`transparency-tab-${tb}`}
              aria-selected={selected}
              aria-controls={`transparency-panel-${tb}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tb)}
              className={
                "rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
                (selected
                  ? "border-accent text-text"
                  : "border-transparent text-text-secondary hover:text-text")
              }
            >
              {tabLabel(tb, lang)}
            </button>
          );
        })}
      </div>
      <div className="pt-6">
        {TAB_ORDER.map((tb) => {
          const selected = tb === tab;
          return (
            <div
              key={tb}
              role="tabpanel"
              id={`transparency-panel-${tb}`}
              aria-labelledby={`transparency-tab-${tb}`}
              hidden={!selected}
              className="text-sm text-text-secondary"
            >
              {selected ? (
                <TabBody
                  tab={tb}
                  id={id}
                  versionMeta={versionMeta}
                  aggregated={aggregated}
                  state={state}
                  onStateChange={onStateChange}
                />
              ) : null}
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
  id,
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
      id={id}
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
  lang,
}: {
  coverageWarning: boolean;
  humanReviewCompleted: boolean;
  lang: Lang;
}) {
  if (!coverageWarning && humanReviewCompleted) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      {coverageWarning ? (
        <Ribbon
          tone="warn"
          label={t(UI_STRINGS.TRANSPARENCY_PARTIAL_COVERAGE_LABEL, lang)}
          detail={t(UI_STRINGS.TRANSPARENCY_PARTIAL_COVERAGE_DETAIL, lang)}
        />
      ) : null}
      {!humanReviewCompleted ? (
        <Ribbon
          tone="warn"
          label={t(UI_STRINGS.TRANSPARENCY_HUMAN_REVIEW_PENDING_LABEL, lang)}
          detail={t(UI_STRINGS.TRANSPARENCY_HUMAN_REVIEW_PENDING_DETAIL, lang)}
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
  lang,
}: {
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
  lang: Lang;
}) {
  const modelCount = Object.keys(versionMeta.analysis?.models ?? {}).length;
  const items: Array<{ label: string; value: string }> = [
    { label: t(UI_STRINGS.TRANSPARENCY_SUMMARY_VERSION, lang), value: versionMeta.version_date },
    { label: t(UI_STRINGS.TRANSPARENCY_SUMMARY_SCHEMA, lang), value: aggregated.schema_version },
    { label: t(UI_STRINGS.TRANSPARENCY_SUMMARY_MODELS, lang), value: String(modelCount) },
    {
      label: t(UI_STRINGS.TRANSPARENCY_SUMMARY_AGGREGATION, lang),
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

function TabBody({
  tab,
  id,
  versionMeta,
  aggregated,
  state,
  onStateChange,
}: {
  tab: TransparencyTab;
  id: string;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
  state: TransparencyHashState | null;
  onStateChange: (next: TransparencyHashState | null) => void;
}) {
  const versionDate = versionMeta.version_date;
  const humanReviewCompleted =
    versionMeta.aggregation?.human_review_completed ?? false;
  switch (tab) {
    case "sources": {
      const selectedFile =
        state && state.tab === "sources" ? state.file : undefined;
      return (
        <SourcesTab
          id={id}
          versionDate={versionDate}
          selectedFile={selectedFile}
          onSelectFile={(filename) =>
            onStateChange(
              filename
                ? { tab: "sources", file: filename }
                : { tab: "sources" },
            )
          }
          onRequestDocumentTab={() => onStateChange({ tab: "document" })}
        />
      );
    }
    case "document": {
      const anchor =
        state && state.tab === "document" ? state.anchor : undefined;
      return (
        <DocumentTab
          id={id}
          versionDate={versionDate}
          humanReviewCompleted={humanReviewCompleted}
          anchor={anchor}
        />
      );
    }
    case "prompts": {
      const highlightedSha =
        state && state.tab === "prompts" ? state.sha : undefined;
      return (
        <PromptsTab
          versionMeta={versionMeta}
          highlightedSha={highlightedSha}
        />
      );
    }
    case "results": {
      return (
        <ResultsTab
          id={id}
          versionMeta={versionMeta}
          aggregated={aggregated}
          state={state}
          onStateChange={onStateChange}
        />
      );
    }
    default:
      return <TabPlaceholder tab={tab} />;
  }
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
