// Post-build smoke check — task 0064.
// Asserts that the static export contains the expected files and content.
// Dependency-free (node:fs + node:path only).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(SITE_DIR, "out");

const failures: string[] = [];

function assertFile(rel: string) {
  const abs = path.join(OUT_DIR, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`missing file: ${rel}`);
    return null;
  }
  return abs;
}

function assertContains(rel: string, needle: string) {
  const abs = assertFile(rel);
  if (!abs) return;
  const body = fs.readFileSync(abs, "utf8");
  if (!body.includes(needle)) {
    failures.push(`${rel} missing content: ${JSON.stringify(needle)}`);
  }
}

// 1. Candidate page rendered.
const INDEX = "candidat/test-omega/index.html";
assertFile(INDEX);

// 2. Display name present.
assertContains(INDEX, "Omega Synth");

// 3. All five section ids are present (stable anchors, see 0056/0057).
for (const anchorId of [
  'id="synthese"',
  'id="positionnement"',
  'id="dimensions"',
  'id="intergen"',
  'id="risques"',
]) {
  assertContains(INDEX, anchorId);
}

// 4. Transparency footer sha256 is rendered in full (no truncation).
assertContains(
  INDEX,
  "6838918439fd1b3b711af245ffd40c5813b729cdd2db7880856b854edc1f29b1",
);

// 5. Copied static artifacts.
assertFile("candidates/test-omega/2027-11-01/aggregated.json");
assertFile("candidates/test-omega/2027-11-01/metadata.json");
assertFile("candidates/test-omega/2027-11-01/sources.md");
assertFile("candidates/test-omega/2027-11-01/raw-outputs/index.html");

if (failures.length > 0) {
  console.error("[verify-build] FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("[verify-build] OK — all acceptance checks passed.");
