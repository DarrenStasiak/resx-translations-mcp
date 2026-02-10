// We intentionally use the low-level `Server` class instead of the
// higher-level `McpServer` wrapper.  `Server` is marked @deprecated in the
// SDK, but `McpServer` does not yet expose the same degree of control over
// raw JSON-RPC request/response handling that we need here.  Revisit once
// the SDK provides an equivalent API surface on `McpServer`.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { logger } from "./utils/index.js";
import {
  toolDefinitions,
  handleGetTranslations,
  handleUpsertTranslation,
} from "./tools/index.js";

/**
 * Create and configure the MCP server instance with all tool handlers
 * registered.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export function createServer(): Server {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  // ── List available tools ────────────────────────────────────────────

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: toolDefinitions,
  }));

  // ── Dispatch tool calls ─────────────────────────────────────────────

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get_translations":
          return await handleGetTranslations(args);

        case "upsert_translation":
          return await handleUpsertTranslation(args);

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Tool '${name}' failed`, error);
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  });

  return server;
}
