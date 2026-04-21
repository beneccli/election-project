"use client";
// Interactive model-highlight panel for the Positionnement section.
// See docs/specs/website/candidate-page-polish.md §5.1.
//
// Design mirrors `Candidate Page.html` `PositionnementSection` sidebar:
// a vertical stack of clickable rows — "Consensus (médiane)" first, then
// one row per model. Selection is single: clicking a model isolates its
// polygon; clicking the consensus row (or clicking the active model
// again) returns to the consensus view.
import type { RadarModelShape } from "@/lib/derived/positioning-shape";
import { modelColor } from "@/lib/model-color";

export function PositioningToggles({
  models,
  highlight,
  onSelect,
}: {
  models: RadarModelShape[];
  /** `null` means "Consensus (médiane)" is selected. */
  highlight: string | null;
  onSelect: (id: string | null) => void;
}) {
  const consensusActive = highlight === null;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <button
        type="button"
        aria-pressed={consensusActive}
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          consensusActive ? "bg-bg-subtle" : "hover:bg-bg-subtle/60"
        }`}
      >
        <span
          aria-hidden="true"
          className="inline-block h-[2px] w-5 flex-shrink-0 bg-accent"
        />
        <span
          className={`text-[11px] text-text-secondary ${
            consensusActive ? "font-semibold" : "font-normal"
          }`}
        >
          Consensus (médiane)
        </span>
      </button>
      {models.map((m) => {
        const on = highlight === m.id;
        const color = modelColor(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(on ? null : m.id)}
            className={`flex items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              on ? "bg-bg-subtle" : "hover:bg-bg-subtle/60"
            }`}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span
              className={`text-[11px] text-text-secondary ${
                on ? "font-semibold" : "font-normal"
              }`}
            >
              {m.id}
            </span>
          </button>
        );
      })}
    </div>
  );
}
