import * as path from "node:path";
import { describe, it, expect } from "vitest";
import { handleGetTranslations } from "../src/tools/get-translations.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const BASE_PATH = path.join(FIXTURES_DIR, "Language.resx");

describe("handleGetTranslations", () => {
  it("returns translations for a key that exists in all files", async () => {
    const result = await handleGetTranslations({ basePath: BASE_PATH, key: "BUTTON_SAVE" });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]!.text) as {
      key: string;
      translations: Record<string, string>;
    };

    expect(parsed.key).toBe("BUTTON_SAVE");
    expect(parsed.translations["default"]).toBe("Zapisz");
    expect(parsed.translations["en-US"]).toBe("Save");
    expect(parsed.translations["de-DE"]).toBe("Speichern");
  });

  it("marks missing keys with [NOT_FOUND] per language", async () => {
    const result = await handleGetTranslations({
      basePath: BASE_PATH,
      key: "TITLE_HOME",
    });

    const parsed = JSON.parse(result.content[0]!.text) as {
      key: string;
      translations: Record<string, string>;
    };

    // TITLE_HOME exists in Language.resx and Language.en-US.resx but not de-DE
    expect(parsed.translations["default"]).toBe("Strona główna");
    expect(parsed.translations["en-US"]).toBe("Home");
    expect(parsed.translations["de-DE"]).toBe("[NOT_FOUND]");
  });

  it("returns descriptive message when key is not found anywhere", async () => {
    const result = await handleGetTranslations({
      basePath: BASE_PATH,
      key: "COMPLETELY_MISSING",
    });

    expect(result.content[0]!.text).toContain("was not found in any");
  });

  it("returns error for missing basePath parameter", async () => {
    await expect(handleGetTranslations({ key: "X" })).rejects.toThrow(
      "non-empty string",
    );
  });

  it("returns error for missing key parameter", async () => {
    await expect(
      handleGetTranslations({ basePath: BASE_PATH }),
    ).rejects.toThrow("non-empty string");
  });

  it("returns error for non-.resx basePath", async () => {
    await expect(
      handleGetTranslations({ basePath: "file.xml", key: "X" }),
    ).rejects.toThrow("must point to a .resx file");
  });
});
