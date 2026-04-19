// See docs/specs/website/nextjs-architecture.md §6
// Pure presentational. No interactivity.

export function ConfidenceDots({
  value,
  label,
}: {
  /** [0, 1] */
  value: number;
  /** Optional French label prefix, e.g. "Probabilité" or "Confiance". */
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * 5);
  const pct = Math.round(clamped * 100);
  const aria = label ? `${label} : ${pct} %` : `${pct} %`;
  return (
    <span
      role="img"
      aria-label={aria}
      className="inline-flex items-center gap-[2px] align-middle"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={[
            "inline-block h-[6px] w-[6px] rounded-full",
            i < filled ? "bg-accent" : "bg-rule",
          ].join(" ")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
