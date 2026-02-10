/**
 * Parsed representation of a single `<data>` element in a .resx file.
 */
export interface ResxDataEntry {
  $: {
    name: string;
    "xml:space"?: string;
  };
  value?: string[];
  comment?: string[];
}

/**
 * Parsed representation of the `<root>` element in a .resx file.
 */
export interface ResxRoot {
  resheader?: unknown[];
  assembly?: unknown[];
  metadata?: unknown[];
  data?: ResxDataEntry[];
}

/**
 * Top-level parsed structure of a .resx XML document.
 */
export interface ResxDocument {
  root: ResxRoot;
}

/**
 * Result of a translation lookup across language variants.
 */
export interface TranslationResult {
  key: string;
  translations: Record<string, string>;
}

/**
 * Result of parsing a `.resx` file, bundling the document with the detected
 * line-ending style so the original formatting can be preserved on write.
 */
export interface ParsedResxFile {
  document: ResxDocument;
  /** Detected line ending: `"\r\n"` (CRLF) or `"\n"` (LF). */
  eol: string;
}

/**
 * Describes the outcome of an upsert operation.
 */
export type UpsertAction = "added" | "updated";
