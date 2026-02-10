/**
 * Input-validation helpers used by tool handlers.
 *
 * Every function throws a descriptive `Error` if validation fails so the
 * caller can surface the message directly to the MCP client.
 */

/**
 * Asserts that `value` is a non-empty string and returns it trimmed.
 */
export function requireString(value: unknown, paramName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `Parameter '${paramName}' is required and must be a non-empty string.`,
    );
  }
  return value.trim();
}

/**
 * Asserts that a file path ends with `.resx` (case-insensitive).
 */
export function requireResxPath(value: unknown, paramName: string): string {
  const filePath = requireString(value, paramName);
  if (!filePath.toLowerCase().endsWith(".resx")) {
    throw new Error(
      `Parameter '${paramName}' must point to a .resx file (got '${filePath}').`,
    );
  }
  return filePath;
}
