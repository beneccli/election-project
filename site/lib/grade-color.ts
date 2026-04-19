// See docs/specs/website/nextjs-architecture.md §6
// Canonical grade → OKLCH color map. Used by GradeBadge and tiles.

export type GradeLetter = "A" | "B" | "C" | "D" | "F" | "NOT_ADDRESSED";

export function gradeColor(grade: GradeLetter): string {
  switch (grade) {
    case "A":
      return "oklch(0.42 0.16 145)";
    case "B":
      return "oklch(0.52 0.14 145)";
    case "C":
      return "oklch(0.58 0.12 80)";
    case "D":
      return "oklch(0.55 0.16 50)";
    case "F":
      return "var(--risk-red)";
    case "NOT_ADDRESSED":
    default:
      return "var(--text-tertiary)";
  }
}
