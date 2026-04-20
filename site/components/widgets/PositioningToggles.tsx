"use client";
// Interactive model-overlay toggle panel for the Positionnement section.
// See docs/specs/website/candidate-page-polish.md §5.1.
//
// Renders one togglable swatch per model present in `shape.models`, plus
// a non-interactive "Consensus" indicator and "Tous" / "Aucun" shortcuts.
// State is lifted from the parent client component so the radar and the
// legend share the same `enabledModels` set.
import type { RadarModelShape } from "@/lib/derived/positioning-shape";
import { modelColor } from "@/lib/model-color";

export function PositioningToggles({
  models,
  enabled,
  onToggle,
  onAll,
  onNone,
}: {
  models: RadarModelShape[];
  enabled: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <span
          aria-hidden="true"
          className="inline-block h-[10px] w-5 rounded-sm bg-accent/60"
          style={{ borderColor: "var(--accent)" }}
        />
        <span className="font-semibold">Consensus</span>
        <span className="text-text-tertiary">· toujours affiché</span>
      </div>
      {models.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Superposer un modèle
            </span>
            <button
              type="button"
              onClick={onAll}
              className="rounded-sm border border-rule px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary hover:bg-rule/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Tous
            </button>
            <button
              type="button"
              onClick={onNone}
              className="rounded-sm border border-rule px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary hover:bg-rule/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Aucun
            </button>
          </div>
          <ul className="m-0 flex flex-wrap list-none gap-x-3 gap-y-1.5 p-0">
            {models.map((m) => {
              const on = enabled.has(m.id);
              const color = modelColor(m.id);
              return (
                <li key={m.id} className="m-0 p-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-transparent px-1.5 py-0.5 text-xs text-text-secondary hover:border-rule focus:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-pressed:border-rule aria-pressed:bg-rule/30"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-[10px] w-[10px] rounded-full border-[1.5px]"
                      style={{
                        borderColor: color,
                        background: on ? color : "var(--bg)",
                      }}
                    />
                    <span className={on ? "font-semibold" : undefined}>
                      {m.id}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <span className="text-xs italic text-text-tertiary">
          Aucun modèle disponible pour la superposition.
        </span>
      )}
    </div>
  );
}
