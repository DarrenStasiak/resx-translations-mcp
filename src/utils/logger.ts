/**
 * Lightweight logger that writes exclusively to **stderr** so it never
 * interferes with the MCP JSON-RPC traffic on stdout.
 */
export const logger = {
  info(message: string): void {
    process.stderr.write(`[INFO]  ${message}\n`);
  },

  warn(message: string): void {
    process.stderr.write(`[WARN]  ${message}\n`);
  },

  error(message: string, error?: unknown): void {
    let suffix = "";
    if (error instanceof Error) {
      suffix = `: ${error.message}`;
    } else if (error !== undefined && error !== null) {
      suffix = `: ${JSON.stringify(error)}`;
    }
    process.stderr.write(`[ERROR] ${message}${suffix}\n`);
  },
} as const;
