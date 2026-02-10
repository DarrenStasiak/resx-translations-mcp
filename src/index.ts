#!/usr/bin/env node

/**
 * Entry point for the resx-translations-mcp.
 *
 * Responsibilities are intentionally minimal:
 *   1. Wire up the MCP server to a stdio transport.
 *   2. Register graceful-shutdown handlers.
 *   3. Start listening.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { createServer } from "./server.js";
import { logger, attachServerToLogger } from "./utils/index.js";

async function main(): Promise<void> {
  const server = createServer();
  attachServerToLogger(server);
  const transport = new StdioServerTransport();

  // Graceful shutdown on SIGINT / SIGTERM.
  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down…");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.connect(transport);
  logger.info(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error: unknown) => {
  logger.error("Fatal error during startup", error);
  process.exit(1);
});
