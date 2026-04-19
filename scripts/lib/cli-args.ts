/**
 * CLI argv helpers.
 *
 * pnpm forwards a literal `--` separator to the child script when invoked
 * as `pnpm run <script> -- --flag value`. commander treats `--` as an
 * end-of-options marker, so any flags after it are dumped into
 * `program.args` and never parsed. `npm run <script> -- --flag` strips
 * the `--` itself, so the inconsistency is purely a package-manager
 * artefact.
 *
 * `normalizeArgv` removes a single leading `--` token (if any) from the
 * user-arg portion of argv, so the same CLI invocation works under npm,
 * pnpm, and yarn.
 */
export function normalizeArgv(argv: string[]): string[] {
  // argv is [node, script, ...userArgs]. If the first user arg is `--`,
  // drop it. Subsequent `--` tokens are preserved (they may be meaningful
  // for forwarded commands).
  if (argv.length >= 3 && argv[2] === "--") {
    return [...argv.slice(0, 2), ...argv.slice(3)];
  }
  return argv;
}
