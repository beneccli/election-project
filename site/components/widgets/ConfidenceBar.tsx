// See docs/specs/website/nextjs-architecture.md §6
// Linear variant of ConfidenceDots. Pure presentational.

export function ConfidenceBar({
  value,
  label = "confiance",
  showValue = true,
}: {
  /** [0, 1] */
  value: number;
  /** French label appended to the percentage, e.g. "N% confiance". */
  label?: string;
  /** Render the inline "N% label" caption. */
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const aria = `${label} : ${pct} %`;
  return (
    <span
      role="img"
      aria-label={aria}
      className="inline-flex items-center gap-2 align-middle"
    >
      <span
        className="relative inline-block h-[4px] w-[96px] overflow-hidden rounded-full bg-rule"
        aria-hidden="true"
      >
        <span
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "var(--accent)",
          }}
        />
      </span>
      {showValue ? (
        <span className="text-[11px] tabular-nums text-text-tertiary">
          {pct}% {label}
        </span>
      ) : null}
    </span>
  );
}
