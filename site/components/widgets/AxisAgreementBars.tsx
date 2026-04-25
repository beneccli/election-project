// See docs/specs/website/nextjs-architecture.md §4.3
// Per-axis ordinal agreement rows. Server component.
//
// EDITORIAL: `modal_score` (ordinal) and `consensus_interval` are
// displayed; NEVER an arithmetic average.
import type { AggregatedOutput } from "@/lib/schema";
import { AXIS_KEYS, type AxisKey } from "@/lib/derived/keys";
import { AXES } from "@/lib/anchors";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { Tooltip } from "./Tooltip";
import { modelColor } from "@/lib/model-color";

const MIN = -5;
const MAX = 5;
const SPAN = MAX - MIN;

function pct(v: number): number {
  return ((v - MIN) / SPAN) * 100;
}

export function AxisAgreementBars({
  positioning,
  lang = "fr",
}: {
  positioning: AggregatedOutput["positioning"];
  lang?: Lang;
}) {
  return (
    <div className="flex flex-col gap-6">
      {AXIS_KEYS.map((key) => (
        <AxisRow key={key} axis={key} data={positioning[key]} lang={lang} />
      ))}
    </div>
  );
}

function AxisRow({
  axis,
  data,
  lang,
}: {
  axis: AxisKey;
  data: AggregatedOutput["positioning"][AxisKey];
  lang: Lang;
}) {
  const meta = AXES.find((a) => a.axis === axis);
  const label = meta ? t(meta.label, lang) : axis;
  const polarLow = meta ? t(meta.polarLow, lang) : "−5";
  const polarHigh = meta ? t(meta.polarHigh, lang) : "+5";
  const [lo, hi] = data.consensus_interval;
  const dissentSpread = hi - lo;
  const hasDissent = data.dissent.length > 0 || dissentSpread >= 2;

  return (
    <div>
      <div className="mb-1.5 flex justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <span
          className={[
            "text-xs",
            hasDissent
              ? "font-semibold text-risk-red"
              : "font-normal text-text-secondary",
          ].join(" ")}
        >
          {hasDissent
            ? format(t(UI_STRINGS.AXIS_AGREEMENT_DISSENT, lang), { spread: dissentSpread })
            : format(t(UI_STRINGS.AXIS_AGREEMENT_INTERVAL, lang), { spread: dissentSpread })}
        </span>
      </div>
      <div className="relative h-6 rounded-sm bg-bg-subtle">
        {/* center tick */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 top-0 w-px bg-rule opacity-50"
          style={{ left: "50%" }}
        />
        {/* Anchor ticks */}
        {meta
          ? meta.anchors.map((a) => (
              <Tooltip
                key={a.position}
                content={t(a.label, lang)}
                className="!absolute bottom-0 top-0 w-px bg-rule opacity-40"
                style={{ left: `${pct(a.position)}%` }}
              >
                <span aria-hidden="true" className="block h-full w-full" />
              </Tooltip>
            ))
          : null}
        {/* Consensus interval band */}
        <div
          className={[
            "absolute bottom-1 top-1 rounded-sm opacity-20",
            hasDissent ? "bg-risk-red" : "bg-accent",
          ].join(" ")}
          style={{
            left: `${pct(lo)}%`,
            width: `${((hi - lo) / SPAN) * 100}%`,
          }}
        />
        {/* Modal marker (filled) */}
        {data.modal_score !== null ? (
          <Tooltip
            content={format(t(UI_STRINGS.AXIS_AGREEMENT_MODAL_TOOLTIP, lang), { score: data.modal_score })}
            className="!absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-bg bg-accent"
            style={{ left: `${pct(data.modal_score)}%` }}
          >
            <span aria-label={format(t(UI_STRINGS.A11Y_POSITIONING_MODAL_SCORE, lang), { score: data.modal_score })} />
          </Tooltip>
        ) : null}
        {/* Dissenting-model markers (hollow, colored per model) */}
        {data.dissent.map((d, i) => {
          const col = modelColor(d.model);
          return (
            <Tooltip
              key={`${d.model}-${i}`}
              content={
                <>
                  <strong>{d.model}</strong> — position {d.position}
                  <br />
                  {d.reasoning}
                </>
              }
              className="!absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-bg"
              style={{ left: `${pct(d.position)}%`, borderColor: col }}
            >
              <span
                aria-label={format(t(UI_STRINGS.A11Y_POSITIONING_AXIS_DISSENT, lang), { model: d.model, pos: d.position })}
              />
            </Tooltip>
          );
        })}
        {/* end markers */}
      </div>
      <div className="mt-1 flex justify-between text-sm text-text-tertiary">
        <span>{polarLow} (−5)</span>
        <span>{polarHigh} (+5)</span>
      </div>
    </div>
  );
}
