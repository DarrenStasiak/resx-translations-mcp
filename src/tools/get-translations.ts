import * as path from "node:path";

import type { TranslationResult } from "../types.js";
import { EMPTY_VALUE_PLACEHOLDER, NOT_FOUND_PLACEHOLDER } from "../constants.js";
import {
  requireResxPath,
  requireString,
  parseResxFile,
  findRelatedResxFiles,
  getBaseName,
  extractLanguageLabel,
  logger,
} from "../utils/index.js";

/**
 * Retrieves all translations for `key` across every language variant related
 * to `basePath`.
 */
export async function handleGetTranslations(
  args: Record<string, unknown> | undefined,
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const basePath = requireResxPath(args?.basePath, "basePath");
  const key = requireString(args?.key, "key");
  const baseName = getBaseName(basePath);

  logger.info(`Looking up key '${key}' across variants of ${path.basename(basePath)}`);

  const files = await findRelatedResxFiles(basePath);

  if (files.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No .resx files found matching pattern for: ${basePath}`,
        },
      ],
      isError: true,
    };
  }

  const translations: Record<string, string> = {};
  let found = false;

  for (const file of files) {
    const parsed = await parseResxFile(file);
    if (!parsed?.document.root.data || !Array.isArray(parsed.document.root.data))
      continue;

    const entry = parsed.document.root.data.find((d) => d.$.name === key);
    const lang = extractLanguageLabel(file, baseName);

    if (entry) {
      translations[lang] = entry.value?.[0] ?? EMPTY_VALUE_PLACEHOLDER;
      found = true;
    } else {
      translations[lang] = NOT_FOUND_PLACEHOLDER;
    }
  }

  if (!found) {
    return {
      content: [
        {
          type: "text",
          text: `Key '${key}' was not found in any of the files: ${files.map((f) => path.basename(f)).join(", ")}`,
        },
      ],
    };
  }

  const result: TranslationResult = { key, translations };
  logger.info(`Found translations for '${key}' in ${Object.keys(translations).length} file(s)`);

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
