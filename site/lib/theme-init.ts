// See docs/specs/website/nextjs-architecture.md §5
// Early theme init to avoid flash of unstyled content: reads from
// localStorage before React hydrates and sets data-theme on <html>.
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = window.localStorage.getItem("e27-theme");
    if (t !== "dark" && t !== "light") t = "light";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`.trim();
