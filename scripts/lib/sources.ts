/**
 * Text extraction helpers for source files.
 * See docs/specs/data-pipeline/source-gathering.md
 */
import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";

export interface ExtractedSource {
  filename: string;
  content: string;
}

/** Read and extract text from all supported files in a directory. */
export async function extractSourcesFromDir(
  dir: string,
): Promise<ExtractedSource[]> {
  const entries = await readdir(dir);
  const sources: ExtractedSource[] = [];

  for (const entry of entries) {
    // Skip meta files
    if (entry.endsWith(".meta.json") || entry === ".gitkeep") continue;

    const ext = extname(entry).toLowerCase();
    const filePath = join(dir, entry);

    switch (ext) {
      case ".txt":
      case ".md":
      case ".html": {
        const content = await readFile(filePath, "utf-8");
        sources.push({ filename: entry, content });
        break;
      }
      case ".json": {
        const content = await readFile(filePath, "utf-8");
        sources.push({ filename: entry, content });
        break;
      }
      case ".pdf": {
        // PDF extraction stub — real implementation in a future task
        sources.push({
          filename: entry,
          content: `[PDF content extraction pending for: ${entry}]`,
        });
        break;
      }
      case ".url": {
        const content = await readFile(filePath, "utf-8");
        sources.push({ filename: entry, content: `[URL reference: ${content.trim()}]` });
        break;
      }
      default:
        // Skip unsupported file types silently
        break;
    }
  }

  return sources;
}

/** Format extracted sources into a single text block for the LLM prompt. */
export function formatSourcesForPrompt(sources: ExtractedSource[]): string {
  return sources
    .map((s) => `--- BEGIN: ${s.filename} ---\n${s.content}\n--- END: ${s.filename} ---`)
    .join("\n\n");
}
