/**
 * Utilities for discovering related .resx language files on disk.
 */

import * as path from "node:path";
import { glob } from "glob";

/**
 * Discover all related `.resx` language files that share the same base name.
 *
 * Given `src/Translations/Language.resx`, this returns an array like:
 * ```
 * [
 *   "src/Translations/Language.resx",
 *   "src/Translations/Language.en-US.resx",
 *   "src/Translations/Language.pl-PL.resx",
 * ]
 * ```
 */
export async function findRelatedResxFiles(basePath: string): Promise<string[]> {
  const dir = path.dirname(basePath);
  const baseName = getBaseName(basePath);
  const pattern = path.join(dir, `${baseName}*.resx`).replace(/\\/g, "/"); // glob requires forward slashes
  return glob(pattern);
}

/**
 * Extract the stem from a `.resx` path by stripping the `.resx` extension.
 *
 * **Note:** for language-specific files this returns the full stem including
 * the culture suffix (e.g. `"Language.en-US"`).  When used with the *base*
 * (default) file it returns just the logical name (e.g. `"Language"`).
 *
 * @example
 * getBaseName("Language.resx")        → "Language"
 * getBaseName("Language.en-US.resx")  → "Language.en-US"
 */
export function getBaseName(filePath: string): string {
  return path.basename(filePath, ".resx");
}

/**
 * Extract a human-readable language label from a `.resx` filename.
 *
 * @example
 * extractLanguageLabel("Language.en-US.resx", "Language") → "en-US"
 * extractLanguageLabel("Language.resx", "Language")        → "default"
 */
export function extractLanguageLabel(filePath: string, baseName: string): string {
  const fileName = path.basename(filePath, ".resx");
  if (fileName === baseName) return "default";
  const suffix = fileName.slice(baseName.length + 1);
  return suffix || "default";
}
