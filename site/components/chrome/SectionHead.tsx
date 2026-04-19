// See docs/specs/website/nextjs-architecture.md §5.2 — shared chrome.

export function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <span className="whitespace-nowrap font-sans text-sm font-semibold uppercase tracking-[0.12em] text-accent">
        {label}
      </span>
      <div className="h-px flex-1 bg-rule-light" />
    </div>
  );
}
