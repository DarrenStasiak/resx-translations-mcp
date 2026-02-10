import { describe, it, expect } from "vitest";
import { getBaseName, extractLanguageLabel } from "../src/utils/discovery.js";

describe("getBaseName", () => {
  it("strips .resx from base file", () => {
    expect(getBaseName("Language.resx")).toBe("Language");
  });

  it("strips only .resx from language-specific file", () => {
    expect(getBaseName("Language.en-US.resx")).toBe("Language.en-US");
  });

  it("handles path with directories", () => {
    expect(getBaseName("src/Translations/Language.resx")).toBe("Language");
  });

  it("handles Windows-style paths", () => {
    expect(getBaseName("src\\Translations\\Language.resx")).toBe("Language");
  });
});

describe("extractLanguageLabel", () => {
  it('returns "default" for base file', () => {
    expect(extractLanguageLabel("Language.resx", "Language")).toBe("default");
  });

  it("extracts language code from language-specific file", () => {
    expect(extractLanguageLabel("Language.en-US.resx", "Language")).toBe("en-US");
  });

  it("extracts another language code", () => {
    expect(extractLanguageLabel("Language.de-DE.resx", "Language")).toBe("de-DE");
  });

  it("handles full paths", () => {
    expect(extractLanguageLabel("src/Translations/Language.pl-PL.resx", "Language")).toBe(
      "pl-PL",
    );
  });

  it('returns "default" when suffix is empty after dot', () => {
    // Edge case: baseName matches everything before .resx
    expect(extractLanguageLabel("MyFile.resx", "MyFile")).toBe("default");
  });
});
