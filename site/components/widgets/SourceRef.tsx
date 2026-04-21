// See docs/specs/website/transparency.md §9 "SourceRef component"
//
// A single leaf chip that turns a raw `source_refs` locator into a
// trigger that opens the transparency drawer on the Document tab,
// scrolled to the relevant heading when the locator is of the form
// `sources.md#<slug>`.
//
// This widget is a *pass-through*: it never modifies, re-orders, or
// synthesizes the locator text. Its only job is to make the locator
// clickable.
"use client";
import * as React from "react";
import { useTransparencyHash } from "@/lib/use-transparency-hash";

const SOURCES_MD_ANCHOR = /^sources\.md#([A-Za-z0-9-]+)$/;

/**
 * Parse a `source_refs` locator and return the drawer state that
 * should be opened when the user clicks it.
 *
 * Exported for testing.
 */
export function targetForLocator(
  locator: string,
):
  | { tab: "document"; anchor: string }
  | { tab: "document" } {
  const m = SOURCES_MD_ANCHOR.exec(locator.trim());
  if (m && m[1]) return { tab: "document", anchor: m[1] };
  return { tab: "document" };
}

export function SourceRef({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const [, setState] = useTransparencyHash();
  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setState(targetForLocator(children));
    },
    [children, setState],
  );
  return (
    <button
      type="button"
      onClick={onClick}
      title={children}
      className={
        "inline-flex max-w-[14rem] items-center truncate rounded-sm border border-rule-light bg-bg px-1.5 py-[2px] font-mono text-[10px] text-text-tertiary underline decoration-dotted underline-offset-2 transition-colors hover:border-accent hover:text-text focus:outline-none focus-visible:ring-1 focus-visible:ring-accent " +
        (className ?? "")
      }
      data-source-ref={children}
    >
      {children}
    </button>
  );
}
