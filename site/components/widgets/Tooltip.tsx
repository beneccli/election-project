// Pure-CSS instant tooltip. SSR-safe (no JS, no client boundary).
// Inverts with theme tokens (`bg-text` + `text-bg`), so light theme shows a
// dark bubble with white text and dark theme shows a light bubble with dark
// text — per task 0065 review.
import * as React from "react";

export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
  style,
  as: Tag = "span",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
  style?: React.CSSProperties;
  /** Element used for the wrapper. Defaults to <span>. */
  as?: "span" | "div" | "button";
}) {
  const posClass =
    side === "top"
      ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2"
      : "top-full left-1/2 mt-1.5 -translate-x-1/2";
  return (
    <Tag
      className={`group/tt relative inline-flex ${className}`}
      style={style}
      tabIndex={0}
    >
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute z-50 max-w-[260px] whitespace-normal rounded-sm bg-text px-2 py-1 text-xs font-normal leading-[1.4] text-bg shadow-md opacity-0 transition-opacity duration-75",
          "group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          posClass,
        ].join(" ")}
      >
        {content}
      </span>
    </Tag>
  );
}
