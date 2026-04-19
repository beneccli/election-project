// Transparency footer stub — real implementation lands in task 0063.
// See docs/specs/website/nextjs-architecture.md §5.2
import type { VersionMetadata } from "@/lib/schema";

export function TransparencyFooter({
  versionMeta,
}: {
  versionMeta: VersionMetadata;
}) {
  const modelIds = Object.keys(versionMeta.analysis?.models ?? {});
  const promptVersion = versionMeta.analysis?.prompt_version ?? "n/a";
  return (
    <footer className="mt-24 border-t border-rule bg-bg-subtle">
      <div className="mx-auto max-w-content px-8 py-10 text-xs text-text-secondary">
        <div className="mb-2 font-bold uppercase tracking-wider text-text-tertiary">
          Transparence
        </div>
        <p className="mb-1">
          Analyse basée sur le programme au {versionMeta.version_date}.
        </p>
        <p>
          Modèles : {modelIds.join(", ")} · prompt {promptVersion}.
        </p>
      </div>
    </footer>
  );
}
