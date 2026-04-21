// See docs/specs/website/nextjs-architecture.md §6
// Prototype reference: Candidate Page.html lines 412–421.
import { gradeColor, type GradeLetter } from "@/lib/grade-color";

const SIZES = {
  sm: { outer: 36, font: 18, sub: 12 },
  md: { outer: 56, font: 28, sub: 15 },
  lg: { outer: 72, font: 36, sub: 16 },
} as const;

export function GradeBadge({
  grade,
  modifier = null,
  size = "md",
}: {
  grade: GradeLetter;
  modifier?: "+" | "-" | null;
  size?: keyof typeof SIZES;
}) {
  const sz = SIZES[size];
  const col = gradeColor(grade);
  const display = grade === "NOT_ADDRESSED" ? "—" : grade;
  const ariaLabel =
    grade === "NOT_ADDRESSED"
      ? "Non abordé"
      : `Note ${display}${modifier ?? ""}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative flex flex-shrink-0 items-center justify-center rounded-[4px] font-display font-semibold leading-none"
      style={{
        width: sz.outer,
        height: sz.outer,
        border: `2px solid ${col}`,
        color: col,
        background: `color-mix(in oklch, ${col} 7%, transparent)`,
        fontSize: sz.font,
      }}
    >
      <span>{display}</span>
      {modifier ? (
        <span
          aria-hidden="true"
          className="absolute right-[4px] top-[2px] font-sans font-bold leading-none"
          style={{ fontSize: sz.sub, color: col }}
        >
          {modifier}
        </span>
      ) : null}
    </div>
  );
}
