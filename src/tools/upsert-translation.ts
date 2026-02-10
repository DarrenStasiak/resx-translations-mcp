import * as path from "node:path";

import type { UpsertAction } from "../types.js";
import {
  requireResxPath,
  requireString,
  parseResxFile,
  writeResxFile,
  findEntry,
} from "../utils/index.js";

/**
 * Adds or updates a single translation entry in the specified `.resx` file.
 */
export async function handleUpsertTranslation(
  args: Record<string, unknown> | undefined,
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const filePath = requireResxPath(args?.filePath, "filePath");
  const key = requireString(args?.key, "key");
  const value = requireString(args?.value, "value");

  const parsed = await parseResxFile(filePath);

  if (!parsed) {
    return {
      content: [{ type: "text", text: `Unable to read file: ${filePath}` }],
      isError: true,
    };
  }

  const { document: data, eol } = parsed;

  // Ensure the data array exists.
  if (!Array.isArray(data.root.data)) data.root.data = [];

  const existing = findEntry(data.root.data, key);
  const action: UpsertAction = existing ? "updated" : "added";

  if (existing) {
    existing.value = [value];
  } else {
    data.root.data.push({
      $: { name: key, "xml:space": "preserve" },
      value: [value],
    });
  }

  // Preserve the original line-ending style of the file.
  await writeResxFile(filePath, data, eol);

  return {
    content: [
      {
        type: "text",
        text: `Successfully ${action} key '${key}' in ${path.basename(filePath)} (file sorted alphabetically).`,
      },
    ],
  };
}
