"use client";
// Client wrapper that owns the `enabledModels` state shared between the
// radar overlay and the legend/toggle panel. See spec:
// docs/specs/website/candidate-page-polish.md §5.1.
import { useCallback, useState } from "react";
import type { RadarShape } from "@/lib/derived/positioning-shape";
import { PositioningRadar } from "./PositioningRadar";
import { PositioningToggles } from "./PositioningToggles";

export function InteractivePositioningRadar({
  shape,
}: {
  shape: RadarShape;
}) {
  const [enabled, setEnabled] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const onToggle = useCallback((id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onAll = useCallback(() => {
    setEnabled(new Set(shape.models.map((m) => m.id)));
  }, [shape.models]);

  const onNone = useCallback(() => {
    setEnabled(new Set());
  }, []);

  return (
    <>
      <div className="hidden sm:block">
        <PositioningRadar shape={shape} enabledModels={enabled} />
      </div>
      <PositioningToggles
        models={shape.models}
        enabled={enabled}
        onToggle={onToggle}
        onAll={onAll}
        onNone={onNone}
      />
    </>
  );
}
