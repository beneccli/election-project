// See docs/specs/website/transparency.md §6
//
// Small read-only site configuration. Keep this minimal — the site
// renders from static inputs and should not accumulate runtime flags.

/**
 * GitHub repository slug, `owner/name`. Used to build deep-links into
 * the prompt file's git history when the on-disk prompt has drifted
 * from the version-recorded SHA (spec §6). Override via
 * `NEXT_PUBLIC_GITHUB_REPO`.
 */
export const GITHUB_REPO: string =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "beneccli/election-project";

/**
 * Build a link to a file's commit history on the default branch.
 * `filePath` is a repo-relative path such as `prompts/analyze-candidate.md`.
 */
export function githubHistoryUrl(filePath: string): string {
  const cleaned = filePath.replace(/^\/+/, "");
  return `https://github.com/${GITHUB_REPO}/commits/HEAD/${cleaned}`;
}
