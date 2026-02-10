import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")) as {
  version: string;
};

/** Server identity exposed to MCP clients. */
export const SERVER_NAME = "resx-translations-mcp";

/** Resolved from package.json so the value is always in sync with npm. */
export const SERVER_VERSION: string = pkg.version;

/** Placeholder shown when a key exists but has no value. */
export const EMPTY_VALUE_PLACEHOLDER = "[EMPTY]";

/** Placeholder shown when a key is missing from a language file. */
export const NOT_FOUND_PLACEHOLDER = "[NOT_FOUND]";
