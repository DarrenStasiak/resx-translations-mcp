import * as path from "node:path";
import * as fs from "node:fs/promises";
import { describe, it, expect, afterEach } from "vitest";
import { parseResxFile, writeResxFile, findEntry, detectEol } from "../src/utils/resx.js";
import type { ResxDataEntry, ResxDocument } from "../src/types.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const TEMP_FILE = path.resolve(import.meta.dirname, "fixtures", "_temp.resx");

describe("detectEol", () => {
  it("detects CRLF", () => {
    expect(detectEol("line1\r\nline2\r\n")).toBe("\r\n");
  });

  it("detects LF", () => {
    expect(detectEol("line1\nline2\n")).toBe("\n");
  });

  it("returns CRLF as default when no line breaks are present", () => {
    expect(detectEol("no newlines here")).toBe("\r\n");
  });

  it("prefers CRLF when both present (mixed line endings)", () => {
    // CRLF check comes first, so mixed content reports CRLF.
    expect(detectEol("line1\r\nline2\nline3")).toBe("\r\n");
  });
});

describe("parseResxFile", () => {
  it("parses a valid .resx file and returns document + eol", async () => {
    const result = await parseResxFile(path.join(FIXTURES_DIR, "Language.resx"));
    expect(result).not.toBeNull();
    expect(result!.document.root.data).toBeDefined();
    expect(Array.isArray(result!.document.root.data)).toBe(true);
    expect(["\r\n", "\n"]).toContain(result!.eol);
  });

  it("returns all data entries", async () => {
    const result = await parseResxFile(path.join(FIXTURES_DIR, "Language.resx"));
    expect(result!.document.root.data).toHaveLength(3);
  });

  it("returns null for non-existent file", async () => {
    const result = await parseResxFile(path.join(FIXTURES_DIR, "NonExistent.resx"));
    expect(result).toBeNull();
  });
});

describe("findEntry", () => {
  it("finds an existing entry by key", () => {
    const entries: ResxDataEntry[] = [
      { $: { name: "KEY_A" }, value: ["Value A"] },
      { $: { name: "KEY_B" }, value: ["Value B"] },
    ];
    const result = findEntry(entries, "KEY_B");
    expect(result).toBeDefined();
    expect(result!.value).toEqual(["Value B"]);
  });

  it("returns undefined for missing key", () => {
    const entries: ResxDataEntry[] = [{ $: { name: "KEY_A" }, value: ["Value A"] }];
    expect(findEntry(entries, "MISSING")).toBeUndefined();
  });

  it("handles empty array", () => {
    expect(findEntry([], "KEY")).toBeUndefined();
  });
});

describe("writeResxFile", () => {
  afterEach(async () => {
    try {
      await fs.unlink(TEMP_FILE);
    } catch {
      // ignore if file doesn't exist
    }
  });

  it("writes valid XML that can be re-parsed", async () => {
    const data: ResxDocument = {
      root: {
        data: [
          { $: { name: "ZEBRA", "xml:space": "preserve" }, value: ["Zebra"] },
          { $: { name: "APPLE", "xml:space": "preserve" }, value: ["Apple"] },
        ],
      },
    };

    await writeResxFile(TEMP_FILE, data);
    const result = await parseResxFile(TEMP_FILE);

    expect(result).not.toBeNull();
    expect(result!.document.root.data).toHaveLength(2);
  });

  it("sorts entries alphabetically by key", async () => {
    const data: ResxDocument = {
      root: {
        data: [
          { $: { name: "ZEBRA", "xml:space": "preserve" }, value: ["Zebra"] },
          { $: { name: "APPLE", "xml:space": "preserve" }, value: ["Apple"] },
          { $: { name: "MANGO", "xml:space": "preserve" }, value: ["Mango"] },
        ],
      },
    };

    await writeResxFile(TEMP_FILE, data);
    const result = await parseResxFile(TEMP_FILE);

    const names = result!.document.root.data!.map((d) => d.$.name);
    expect(names).toEqual(["APPLE", "MANGO", "ZEBRA"]);
  });

  it("defaults to CRLF when no eol is specified", async () => {
    const data: ResxDocument = {
      root: {
        data: [{ $: { name: "KEY", "xml:space": "preserve" }, value: ["Val"] }],
      },
    };

    await writeResxFile(TEMP_FILE, data);
    const content = await fs.readFile(TEMP_FILE, "utf-8");

    expect(content).toContain("\r\n");
  });

  it("writes CRLF when explicitly requested", async () => {
    const data: ResxDocument = {
      root: {
        data: [{ $: { name: "KEY", "xml:space": "preserve" }, value: ["Val"] }],
      },
    };

    await writeResxFile(TEMP_FILE, data, "\r\n");
    const content = await fs.readFile(TEMP_FILE, "utf-8");

    expect(content).toContain("\r\n");
  });

  it("writes LF when explicitly requested", async () => {
    const data: ResxDocument = {
      root: {
        data: [{ $: { name: "KEY", "xml:space": "preserve" }, value: ["Val"] }],
      },
    };

    await writeResxFile(TEMP_FILE, data, "\n");
    const content = await fs.readFile(TEMP_FILE, "utf-8");

    // Verify no CRLF leaked in — only bare LF.
    expect(content).not.toContain("\r\n");
    expect(content).toContain("\n");
  });
});
