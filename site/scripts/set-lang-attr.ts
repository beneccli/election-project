// See docs/specs/website/i18n.md §4 (post-export <html lang> rewrite)
//
// Next.js App Router renders a single root layout, so the static
// export emits `<html lang="fr">` for every page including the EN
// tree. This post-export step rewrites `lang="fr"` to `lang="<xx>"`
// in `out/<xx>/**/*.html` so server-rendered HTML matches the locale.
import fs from "node:fs";
import path from "node:path";

const SUPPORTED_LOCALES = ["en"] as const;

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) yield* walk(full);
    else if (name.endsWith(".html")) yield full;
  }
}

function main(): void {
  const outDir = path.resolve(process.cwd(), "out");
  if (!fs.existsSync(outDir)) {
    console.error(`[set-lang-attr] out/ not found at ${outDir}`);
    process.exit(1);
  }
  let total = 0;
  for (const lang of SUPPORTED_LOCALES) {
    const langDir = path.join(outDir, lang);
    if (!fs.existsSync(langDir)) continue;
    for (const file of walk(langDir)) {
      const before = fs.readFileSync(file, "utf8");
      const after = before.replace(/<html lang="fr"/g, `<html lang="${lang}"`);
      if (after !== before) {
        fs.writeFileSync(file, after);
        total += 1;
      }
    }
    console.log(`[set-lang-attr] rewrote html lang to ${lang} in ${langDir}`);
  }
  console.log(`[set-lang-attr] ${total} file(s) updated`);
}

main();
