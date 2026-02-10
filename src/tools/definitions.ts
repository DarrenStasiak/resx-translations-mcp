import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * All MCP tool schemas exposed by this server.
 *
 * Keeping definitions separate from handlers makes them easier to review,
 * test, and document independently.
 */
export const toolDefinitions: Tool[] = [
  {
    name: "get_translations",
    description:
      "Retrieves all translations for a given key across every language-specific .resx file " +
      "related to the provided base file. Pass the path to the default .resx file (e.g. " +
      "Language.resx) and the tool will automatically discover all language variants " +
      "(Language.en-US.resx, Language.pl-PL.resx, etc.) in the same directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        basePath: {
          type: "string",
          description:
            "Path to the base (default) .resx file, e.g. src/Translations/Language.resx",
        },
        key: {
          type: "string",
          description: "The translation key to look up, e.g. 'BUTTON_SAVE'",
        },
      },
      required: ["basePath", "key"],
    },
  },
  {
    name: "upsert_translation",
    description:
      "Adds a new translation key or updates an existing one in the specified .resx file. " +
      "After the operation the file is re-sorted alphabetically by key. " +
      "Use the full path including the language suffix, e.g. Language.en-US.resx.",
    inputSchema: {
      type: "object" as const,
      properties: {
        filePath: {
          type: "string",
          description:
            "Path to the target .resx file, e.g. src/Translations/Language.en-US.resx",
        },
        key: {
          type: "string",
          description: "The translation key, e.g. 'BUTTON_SAVE'",
        },
        value: {
          type: "string",
          description: "The translation value, e.g. 'Save'",
        },
      },
      required: ["filePath", "key", "value"],
    },
  },
];
