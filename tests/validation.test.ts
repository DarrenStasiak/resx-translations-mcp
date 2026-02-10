import { describe, it, expect } from "vitest";
import { requireString, requireResxPath } from "../src/utils/validation.js";

describe("requireString", () => {
  it("returns trimmed string for valid input", () => {
    expect(requireString("  hello  ", "param")).toBe("hello");
  });

  it("throws for undefined", () => {
    expect(() => requireString(undefined, "key")).toThrow(
      "Parameter 'key' is required and must be a non-empty string.",
    );
  });

  it("throws for empty string", () => {
    expect(() => requireString("", "key")).toThrow("non-empty string");
  });

  it("throws for whitespace-only string", () => {
    expect(() => requireString("   ", "key")).toThrow("non-empty string");
  });

  it("throws for non-string types", () => {
    expect(() => requireString(42, "key")).toThrow("non-empty string");
    expect(() => requireString(null, "key")).toThrow("non-empty string");
    expect(() => requireString(true, "key")).toThrow("non-empty string");
  });
});

describe("requireResxPath", () => {
  it("returns path for valid .resx file", () => {
    expect(requireResxPath("Language.resx", "path")).toBe("Language.resx");
  });

  it("accepts case-insensitive extension", () => {
    expect(requireResxPath("File.RESX", "path")).toBe("File.RESX");
  });

  it("throws for non-.resx path", () => {
    expect(() => requireResxPath("file.xml", "path")).toThrow("must point to a .resx file");
  });

  it("throws for empty value", () => {
    expect(() => requireResxPath("", "path")).toThrow("non-empty string");
  });
});
