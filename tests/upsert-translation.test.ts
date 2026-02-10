import * as path from "node:path";
import * as fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handleUpsertTranslation } from "../src/tools/upsert-translation.js";
import { parseResxFile } from "../src/utils/resx.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const TEMP_FILE = path.join(FIXTURES_DIR, "_upsert-temp.resx");

/**
 * Create a minimal .resx file for each test so mutations don't leak between
 * test cases.
 */
async function createTempResx(): Promise<void> {
  const content = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <data name="EXISTING_KEY" xml:space="preserve">
    <value>Old Value</value>
  </data>
</root>`;
  await fs.writeFile(TEMP_FILE, content, "utf-8");
}

describe("handleUpsertTranslation", () => {
  beforeEach(async () => {
    await createTempResx();
  });

  afterEach(async () => {
    try {
      await fs.unlink(TEMP_FILE);
    } catch {
      // ignore
    }
  });

  it("updates an existing key", async () => {
    const result = await handleUpsertTranslation({
      filePath: TEMP_FILE,
      key: "EXISTING_KEY",
      value: "New Value",
    });

    expect(result.content[0]!.text).toContain("updated");
    expect(result.isError).toBeUndefined();

    const parsed = await parseResxFile(TEMP_FILE);
    const entry = parsed!.document.root.data!.find((d) => d.$.name === "EXISTING_KEY");
    expect(entry!.value![0]).toBe("New Value");
  });

  it("adds a new key", async () => {
    const result = await handleUpsertTranslation({
      filePath: TEMP_FILE,
      key: "NEW_KEY",
      value: "Brand New",
    });

    expect(result.content[0]!.text).toContain("added");

    const parsed = await parseResxFile(TEMP_FILE);
    expect(parsed!.document.root.data).toHaveLength(2);
    const entry = parsed!.document.root.data!.find((d) => d.$.name === "NEW_KEY");
    expect(entry!.value![0]).toBe("Brand New");
  });

  it("sorts entries alphabetically after upsert", async () => {
    await handleUpsertTranslation({
      filePath: TEMP_FILE,
      key: "AAA_FIRST",
      value: "First",
    });

    const parsed = await parseResxFile(TEMP_FILE);
    const names = parsed!.document.root.data!.map((d) => d.$.name);
    expect(names).toEqual(["AAA_FIRST", "EXISTING_KEY"]);
  });

  it("throws for missing filePath", async () => {
    await expect(
      handleUpsertTranslation({ key: "X", value: "Y" }),
    ).rejects.toThrow("non-empty string");
  });

  it("throws for missing key", async () => {
    await expect(
      handleUpsertTranslation({ filePath: TEMP_FILE, value: "Y" }),
    ).rejects.toThrow("non-empty string");
  });

  it("throws for missing value", async () => {
    await expect(
      handleUpsertTranslation({ filePath: TEMP_FILE, key: "X" }),
    ).rejects.toThrow("non-empty string");
  });

  it("returns error for non-existent file", async () => {
    const result = await handleUpsertTranslation({
      filePath: path.join(FIXTURES_DIR, "NonExistent.resx"),
      key: "X",
      value: "Y",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Unable to read file");
  });

  it("preserves LF line endings from the original file", async () => {
    // Write a fixture with explicit LF endings.
    const lfContent =
      '<?xml version="1.0" encoding="utf-8"?>\n<root>\n  <data name="K" xml:space="preserve">\n    <value>V</value>\n  </data>\n</root>\n';
    await fs.writeFile(TEMP_FILE, lfContent, "utf-8");

    await handleUpsertTranslation({
      filePath: TEMP_FILE,
      key: "K",
      value: "Updated",
    });

    const written = await fs.readFile(TEMP_FILE, "utf-8");
    expect(written).not.toContain("\r\n");
    expect(written).toContain("\n");
  });

  it("preserves CRLF line endings from the original file", async () => {
    const crlfContent =
      '<?xml version="1.0" encoding="utf-8"?>\r\n<root>\r\n  <data name="K" xml:space="preserve">\r\n    <value>V</value>\r\n  </data>\r\n</root>\r\n';
    await fs.writeFile(TEMP_FILE, crlfContent, "utf-8");

    await handleUpsertTranslation({
      filePath: TEMP_FILE,
      key: "K",
      value: "Updated",
    });

    const written = await fs.readFile(TEMP_FILE, "utf-8");
    expect(written).toContain("\r\n");
  });
});
