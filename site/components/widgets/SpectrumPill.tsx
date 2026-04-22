// See docs/specs/website/landing-page.md §5.5, §5.6
// Shared spectrum chip. Extracted from `Hero.tsx` (candidate page) so
// both the candidate hero and the landing-card surface use identical
// markup / styles. Visual parity with `Hero.tsx` is maintained; only
// the anchor target is configurable.

import type { SpectrumStatus } from "@/lib/derived/spectrum-label";

interface Props {
  /** Localized text to render inside the chip. Null = render nothing. */
  displayText: string | null;
  /** Categorical status — exposed via `data-spectrum-status`. */
  status: SpectrumStatus;
  /** Per-model breakdown lines shown in the native tooltip. */
  tooltipLines: string[];
  /** Target for the wrapping <a>. Defaults to `#positionnement`. */
  href?: string;
  /** Aria-label prefix. Defaults to `Positionnement : `. */
  labelPrefix?: string;
  /** Extra class names appended to the default. */
  className?: string;
  /**
   * When true, render as a non-interactive <span> instead of an <a>.
   * Use when the pill is already inside a clickable ancestor — nested
   * anchors are invalid HTML and break hydration.
   */
  static?: boolean;
}

export default function SpectrumPill({
  displayText,
  status,
  tooltipLines,
  href = "#positionnement",
  labelPrefix = "Positionnement : ",
  className = "",
  static: isStatic = false,
}: Props) {
  if (!displayText) return null;
  const baseClass =
    `rounded text-[11px] text-text-tertiary hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`.trim();
  if (isStatic) {
    return (
      <span
        className={baseClass}
        title={tooltipLines.join("\n")}
        aria-label={`${labelPrefix}${displayText}`}
        data-testid="hero-spectrum-chip"
        data-spectrum-status={status}
      >
        {displayText}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={baseClass}
      title={tooltipLines.join("\n")}
      aria-label={`${labelPrefix}${displayText}`}
      data-testid="hero-spectrum-chip"
      data-spectrum-status={status}
    >
      {displayText}
    </a>
  );
}
