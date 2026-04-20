import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfidenceBar } from "./ConfidenceBar";

function html(
  value: number,
  extra?: { label?: string; showValue?: boolean },
) {
  return renderToStaticMarkup(<ConfidenceBar value={value} {...extra} />);
}

describe("ConfidenceBar", () => {
  it("renders 0% when value is 0", () => {
    const out = html(0);
    expect(out).toContain('aria-label="confiance : 0 %"');
    expect(out).toContain("width:0%");
    expect(out).toContain("0% confiance");
  });

  it("renders 50% when value is 0.5", () => {
    const out = html(0.5);
    expect(out).toContain('aria-label="confiance : 50 %"');
    expect(out).toContain("width:50%");
    expect(out).toContain("50% confiance");
  });

  it("renders 100% when value is 1", () => {
    const out = html(1);
    expect(out).toContain('aria-label="confiance : 100 %"');
    expect(out).toContain("width:100%");
    expect(out).toContain("100% confiance");
  });

  it("clamps values outside [0, 1]", () => {
    expect(html(-0.3)).toContain("width:0%");
    expect(html(1.7)).toContain("width:100%");
  });

  it("honours a custom label", () => {
    const out = html(0.42, { label: "robustesse" });
    expect(out).toContain('aria-label="robustesse : 42 %"');
    expect(out).toContain("42% robustesse");
  });

  it("hides the caption when showValue is false", () => {
    const out = html(0.5, { showValue: false });
    expect(out).not.toContain("50% confiance");
    expect(out).toContain("width:50%");
  });
});
