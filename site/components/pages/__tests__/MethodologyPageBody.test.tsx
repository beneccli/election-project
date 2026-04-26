// See docs/specs/website/methodology-page.md §3 and §6.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MethodologyPageBody } from "@/components/pages/MethodologyPageBody";
import { METHODOLOGY_SECTION_IDS } from "@/lib/methodology-content";

describe("MethodologyPageBody", () => {
  for (const lang of ["fr", "en"] as const) {
    test(`renders all canonical section anchors in ${lang}`, () => {
      const html = renderToStaticMarkup(<MethodologyPageBody lang={lang} />);
      for (const id of METHODOLOGY_SECTION_IDS) {
        expect(html).toContain(`id="${id}"`);
      }
    });
  }
});
