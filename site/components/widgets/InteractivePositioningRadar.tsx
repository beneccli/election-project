"use client";
// Client wrapper that owns the single `highlight` selection shared between
// the radar overlay and the toggle list. See spec:
// docs/specs/website/candidate-page-polish.md §5.1.
//
// Semantics mirror `Candidate Page.html`:
//  - highlight = null → show consensus (thick) + every model overlay.
//  - highlight = id   → show only that model's polygon (no consensus fill).
import { useCallback, useState } from "react";
import type { RadarShape } from "@/lib/derived/positioning-shape";
import { PositioningRadar } from "./PositioningRadar";
import { PositioningToggles } from "./PositioningToggles";

export function InteractivePositioningRadar({
  shape,
}: {
  shape: RadarShape;
}) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const onSelect = useCallback((id: string | null) => {
    setHighlight(id);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="hidden sm:block">
        <PositioningRadar shape={shape} highlight={highlight} />
      </div>
      <PositioningToggles
        models={shape.models}
        highlight={highlight}
        onSelect={onSelect}
      />
    </div>
  );
}
