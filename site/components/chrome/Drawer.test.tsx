import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Drawer } from "./Drawer";

// Radix's <Dialog.Portal> is a client-only primitive — it returns null
// during SSR. Runtime behaviors (ESC-to-close, backdrop click,
// focus-trap, focus-return on close) are guaranteed by
// @radix-ui/react-dialog and exercised by that library's own test
// suite. These SSR-level tests cover the integration surface: that
// our wrapper does not crash on render and emits no dialog content
// when closed.
//
// TODO(jsdom): once the site workspace gains jsdom + testing-library,
// add runtime tests for ESC, backdrop close, focus return.

describe("Drawer", () => {
  it("does not render dialog content when closed", () => {
    const html = renderToStaticMarkup(
      <Drawer
        open={false}
        onOpenChange={() => undefined}
        title="Tous les risques"
      >
        <p>hidden body</p>
      </Drawer>,
    );
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("hidden body");
  });

  it("renders without throwing when opened (SSR)", () => {
    expect(() =>
      renderToStaticMarkup(
        <Drawer
          open={true}
          onOpenChange={() => undefined}
          title="Titre"
          description="Description"
        >
          <p>body</p>
        </Drawer>,
      ),
    ).not.toThrow();
  });

  it("accepts an optional description without affecting closed-state SSR", () => {
    const withoutDesc = renderToStaticMarkup(
      <Drawer open={false} onOpenChange={() => undefined} title="Titre">
        <p>body</p>
      </Drawer>,
    );
    const withDesc = renderToStaticMarkup(
      <Drawer
        open={false}
        onOpenChange={() => undefined}
        title="Titre"
        description="Description"
      >
        <p>body</p>
      </Drawer>,
    );
    expect(withoutDesc).toBe(withDesc);
  });
});
