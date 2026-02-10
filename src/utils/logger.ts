/**
 * Structured logger that writes to **stderr** and — once a server instance
 * is attached — also forwards messages as MCP `notifications/message`.
 *
 * The stderr output is always enabled so diagnostic messages are visible
 * even before the MCP handshake completes.
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

// ── Severity ordering (syslog-style, lowest = most verbose) ─────────

const LEVEL_SEVERITY: Record<LoggingLevel, number> = {
  debug: 0,
  info: 1,
  notice: 2,
  warning: 3,
  error: 4,
  critical: 5,
  alert: 6,
  emergency: 7,
};

// ── Logger state ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-deprecated
let _server: Server | null = null;
let _minLevel: LoggingLevel = "debug";

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Bind the logger to an MCP server so it can send `notifications/message`.
 * Call once after creating the server, before connecting the transport.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export function attachServerToLogger(server: Server): void {
  _server = server;
}

/**
 * Set the minimum log level.  Messages below this severity are discarded.
 * Called by the `logging/setLevel` request handler.
 */
export function setLogLevel(level: LoggingLevel): void {
  _minLevel = level;
}

/** Current minimum log level. */
export function getLogLevel(): LoggingLevel {
  return _minLevel;
}

function shouldLog(level: LoggingLevel): boolean {
  return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[_minLevel];
}

function formatMessage(level: string, message: string, error?: unknown): string {
  let suffix = "";
  if (error instanceof Error) {
    suffix = `: ${error.message}`;
  } else if (error !== undefined && error !== null) {
    suffix = `: ${JSON.stringify(error)}`;
  }
  return `[${level.toUpperCase().padEnd(5)}] ${message}${suffix}`;
}

function emit(level: LoggingLevel, message: string, error?: unknown): void {
  if (!shouldLog(level)) return;

  // Always write to stderr for local diagnostics.
  process.stderr.write(formatMessage(level, message, error) + "\n");

  // Forward to MCP client if connected.
  if (_server) {
    const data = error instanceof Error
      ? `${message}: ${error.message}`
      : message;

    _server.sendLoggingMessage({ level, logger: "resx-translations-mcp", data }).catch(() => {
      // Swallow — the transport may not be ready yet.
    });
  }
}

export const logger = {
  debug(message: string): void {
    emit("debug", message);
  },
  info(message: string): void {
    emit("info", message);
  },
  warn(message: string): void {
    emit("warning", message);
  },
  error(message: string, error?: unknown): void {
    emit("error", message, error);
  },
} as const;
