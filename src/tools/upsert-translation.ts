import * as path from "node:path";

import type { UpsertAction } from "../types.js";
import {
  requireResxPath,
  requireString,
  parseResxFile,
  writeResxFile,
  findEntry,
  withFileLock,
  logger,
} from "../utils/index.js";

/**
 * Adds or updates a single translation entry in the specified `.resx` file.
 *
 * The entire read → modify → write cycle is executed under an exclusive
 * file lock so that concurrent calls (from parallel MCP requests or even
 * other MCP server instances) never overwrite each other's changes.
 */
export async function handleUpsertTranslation(
  args: Record<string, unknown> | undefined,
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const filePath = requireResxPath(args?.filePath, "filePath");
  const key = requireString(args?.key, "key");
  let value = requireString(args?.value, "value");
  // Normalize line endings: replace \r\n with \n, then remove stray \r
  value = value.replace(/\r\n/g, "\n").replace(/\r/g, "");

  logger.info(`Upserting key '${key}' in ${path.basename(filePath)}`);

  return withFileLock(filePath, async () => {
    logger.debug(`Acquired lock for ${path.basename(filePath)}`);
    // Read the file *inside* the lock so we always see the latest content,
    // even if another process or MCP call just finished writing to it.
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
    logger.info(`Successfully ${action} key '${key}' in ${path.basename(filePath)}`);

    return {
      content: [
        {
          type: "text",
          text: `Successfully ${action} key '${key}' in ${path.basename(filePath)} (file sorted alphabetically).`,
        },
      ],
    };
  });
}
