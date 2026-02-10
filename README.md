# resx-translations-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI assistants to read and edit .NET `.resx` translation files efficiently — without loading raw XML into context.

## Features

| Tool                 | Description                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_translations`   | Retrieves all translations for a given key across every language variant (`.resx`, `.en-US.resx`, `.pl-PL.resx`, …) in the same directory.        |
| `upsert_translation` | Adds a new key or updates an existing one in a specific `.resx` file. The file is automatically re-sorted alphabetically by key after each write. |

## How It Works

`.resx` files in .NET projects follow a naming convention:

```
Language.resx          ← default / fallback
Language.en-US.resx    ← English (US)
Language.pl-PL.resx    ← Polish
Language.de-DE.resx    ← German
```

When you call `get_translations` with the **base file** path (`Language.resx`) and a key, the server scans the directory for all matching language files and returns every translation for that key in a single response.

When you call `upsert_translation`, you point to a **specific** language file (e.g. `Language.en-US.resx`), provide the key and value, and the server inserts or updates the entry, then sorts the entire file alphabetically.

## Installation

### npx (no install needed)

```bash
npx resx-translations-mcp
```

### From source

```bash
# Clone the repository
git clone https://github.com/DarrenStasiak/resx-translations-mcp.git
cd resx-translations-mcp

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

Add the server to your MCP client configuration.

### Claude Desktop / Claude Code

Using npx (recommended):

```json
{
  "mcpServers": {
    "resx": {
      "command": "npx",
      "args": ["resx-translations-mcp"]
    }
  }
}
```

Or with a local clone:

```json
{
  "mcpServers": {
    "resx": {
      "command": "node",
      "args": ["/absolute/path/to/resx-translations-mcp/dist/index.js"]
    }
  }
}
```

### VS Code (Copilot / MCP extension)

Add to `.vscode/mcp.json`:

Using npx (recommended):

```json
{
  "servers": {
    "resx": {
      "command": "npx",
      "args": ["resx-translations-mcp"]
    }
  }
}
```

Or with a local clone:

```json
{
  "servers": {
    "resx": {
      "command": "node",
      "args": ["/absolute/path/to/resx-translations-mcp/dist/index.js"]
    }
  }
}
```

## Tools Reference

### `get_translations`

Retrieves all translations for a given key.

**Parameters:**

| Name       | Type     | Required | Description                                                                    |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `basePath` | `string` | Yes      | Path to the base (default) `.resx` file, e.g. `src/Translations/Language.resx` |
| `key`      | `string` | Yes      | The translation key to look up                                                 |

**Example response:**

```json
{
  "key": "BUTTON_SAVE",
  "translations": {
    "default": "Zapisz",
    "en-US": "Save",
    "de-DE": "Speichern"
  }
}
```

If the key does not exist in a particular language file, that language returns `"[NOT_FOUND]"`.
If the key is not found in any file, a descriptive message is returned instead.

---

### `upsert_translation`

Adds or updates a translation entry.

**Parameters:**

| Name       | Type     | Required | Description                                                                    |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `filePath` | `string` | Yes      | Path to the specific `.resx` file, e.g. `src/Translations/Language.en-US.resx` |
| `key`      | `string` | Yes      | The translation key                                                            |
| `value`    | `string` | Yes      | The translation value                                                          |

The file is automatically **sorted alphabetically** by key after every write.

## Development

```bash
# Watch mode
npm run dev

# Single build
npm run build
```

## License

[MIT](LICENSE)
