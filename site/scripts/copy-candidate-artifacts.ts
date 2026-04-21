// Build-time script — copies candidate transparency artifacts into
// `site/public/candidates/<id>/<version>/` so they ship statically with
// `next export`.
//
// Reuses the loader for discovery (EXCLUDE_FICTIONAL / CANDIDATES_DIR
// env vars are honored).
// See docs/specs/website/nextjs-architecture.md §5.2, task 0063.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listCandidates } from "../lib/candidates";
import {
  buildSourcesRawManifest,
  writeSourcesRawManifest,
} from "../lib/manifests/sources-manifest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(SITE_DIR, "public", "candidates");
const CANDIDATES_ROOT =
  process.env.CANDIDATES_DIR ??
  path.resolve(SITE_DIR, "..", "candidates");

function copyRecursive(src: string, dest: string) {
  // `current` is a symlink into versions/<date>/ — dereference so we copy
  // real files rather than recreating the symlink under site/public.
  fs.cpSync(src, dest, {
    recursive: true,
    force: true,
    dereference: true,
    filter: (s) =>
      !s.includes(`${path.sep}_manual`) &&
      !s.endsWith(".DS_Store"),
  });
}

function writeRawOutputsIndex(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const links = files
    .map((f) => `<li><a href="./${f}">${f}</a></li>`)
    .join("\n    ");
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Raw model outputs</title>
<style>body{font-family:DM Sans,system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#222}a{color:#3B6FD4}</style>
<h1>Raw model outputs</h1>
<p>Per-model JSON exactly as emitted by each model. Never edited.</p>
<ul>
    ${links}
</ul>
`;
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function main() {
  if (!fs.existsSync(CANDIDATES_ROOT)) {
    console.warn(`[artifacts] candidates dir not found: ${CANDIDATES_ROOT}`);
    return;
  }

  // Start fresh.
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  let copied = 0;
  for (const c of listCandidates()) {
    const srcCurrent = path.join(CANDIDATES_ROOT, c.id, "current");
    if (!fs.existsSync(srcCurrent)) continue;
    const versionDate = c.versionDate || "current";
    const destDir = path.join(PUBLIC_DIR, c.id, versionDate);
    fs.mkdirSync(destDir, { recursive: true });
    copyRecursive(srcCurrent, destDir);
    writeRawOutputsIndex(path.join(destDir, "raw-outputs"));
    // See docs/specs/website/transparency.md §4 — emit sources-raw/manifest.json
    // (even when empty) so the Sources tab can render without doing a
    // client-side directory listing.
    const sourcesRawDir = path.join(destDir, "sources-raw");
    writeSourcesRawManifest(
      sourcesRawDir,
      buildSourcesRawManifest(sourcesRawDir),
    );
    copied += 1;
  }
  console.log(`[artifacts] copied ${copied} candidate version(s) → ${PUBLIC_DIR}`);
}

main();
