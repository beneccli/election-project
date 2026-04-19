// Model-color legend for the Positionnement section. Shows the consensus
// swatch + a swatch per model id present in the positioning data (union of
// all axis `dissent.model` values). Dissent markers in AxisAgreementBars
// use the same color, so the reader can visually match a hollow dot to a
// model name.
import type { AggregatedOutput } from "@/lib/schema";
import { AXIS_KEYS } from "@/lib/derived/keys";
import { modelColor } from "@/lib/model-color";

export function PositioningLegend({
  positioning,
}: {
  positioning: AggregatedOutput["positioning"];
}) {
  const modelIds = new Set<string>();
  for (const key of AXIS_KEYS) {
    for (const d of positioning[key].dissent) {
      modelIds.add(d.model);
    }
  }
  const models = [...modelIds].sort();

  return (
    <div className="mt-5 flex flex-col gap-2">
      {/* <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="block h-[2px] w-5 rounded-full bg-accent"
        />
        <span className="text-xs font-semibold text-text-secondary">
          Consensus (pentagone + marqueur plein)
        </span>
      </div> */}
      {models.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Modèles en désaccord sur au moins un axe
          </span>
          <ul className="m-0 flex flex-wrap list-none gap-x-3 gap-y-1.5 p-0">
            {models.map((m) => (
              <li
                key={m}
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-[9px] w-[9px] rounded-full border-[1.5px] bg-bg"
                  style={{ borderColor: modelColor(m) }}
                />
                {m}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <span className="text-xs italic text-text-tertiary">
          Aucun désaccord significatif entre les modèles.
        </span>
      )}
    </div>
  );
}
