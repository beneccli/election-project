// Build-time script — content-addressed snapshot of every `prompts/*.md`.
// See docs/specs/website/transparency.md §6 "Build-time contract".
//
// Reads every `*.md` under the repo's top-level `prompts/` and writes it
// to `site/public/prompts/<sha256>.md`. Emits a companion
// `manifest.json` so the drawer can resolve logical names to hashes.
//
// The pure logic lives in `site/lib/build/prompts-snapshot.ts`; this
// file is a thin CLI wrapper.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { snapshotPrompts } from "../lib/manifests/prompts-snapshot";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_DIR = path.resolve(__dirname, "..");
const PROMPTS_ROOT =
  process.env.PROMPTS_DIR ?? path.resolve(SITE_DIR, "..", "prompts");
const PUBLIC_PROMPTS_DIR = path.join(SITE_DIR, "public", "prompts");

function main() {
  const manifest = snapshotPrompts(PROMPTS_ROOT, PUBLIC_PROMPTS_DIR);
  console.log(
    `[prompts] snapshotted ${manifest.files.length} prompt file(s) → ${PUBLIC_PROMPTS_DIR}`,
  );
}

main();
