import * as path from "node:path";
import * as fs from "node:fs/promises";
import { describe, it, expect, afterEach } from "vitest";
import { withFileLock } from "../src/utils/file-lock.js";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "fixtures");
const TEMP_FILE = path.join(FIXTURES_DIR, "_lock-test.resx");
const TEMP_LOCK = TEMP_FILE + ".lock";

async function cleanUp(): Promise<void> {
  await fs.unlink(TEMP_FILE).catch(() => {});
  await fs.unlink(TEMP_LOCK).catch(() => {});
}

describe("withFileLock", () => {
  afterEach(cleanUp);

  it("executes the callback and returns its result", async () => {
    await fs.writeFile(TEMP_FILE, "hello", "utf-8");

    const result = await withFileLock(TEMP_FILE, async () => {
      return "done";
    });

    expect(result).toBe("done");
  });

  it("removes the lockfile after completion", async () => {
    await fs.writeFile(TEMP_FILE, "hello", "utf-8");

    await withFileLock(TEMP_FILE, async () => {});

    await expect(fs.access(TEMP_LOCK)).rejects.toThrow();
  });

  it("removes the lockfile even when the callback throws", async () => {
    await fs.writeFile(TEMP_FILE, "hello", "utf-8");

    await expect(
      withFileLock(TEMP_FILE, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(fs.access(TEMP_LOCK)).rejects.toThrow();
  });

  it("serialises concurrent in-process calls on the same file", async () => {
    await fs.writeFile(TEMP_FILE, "0", "utf-8");

    // Each call reads the current value, increments it, and writes it back.
    // Without serialisation at least one increment would be lost.
    const increment = () =>
      withFileLock(TEMP_FILE, async () => {
        const n = Number(await fs.readFile(TEMP_FILE, "utf-8"));
        // Introduce a small delay to widen the race window.
        await new Promise((r) => setTimeout(r, 10));
        await fs.writeFile(TEMP_FILE, String(n + 1), "utf-8");
      });

    // Launch 10 concurrent increments.
    await Promise.all(Array.from({ length: 10 }, increment));

    const finalValue = Number(await fs.readFile(TEMP_FILE, "utf-8"));
    expect(finalValue).toBe(10);
  });

  it("handles rapid sequential calls without leftover lock files", async () => {
    await fs.writeFile(TEMP_FILE, "x", "utf-8");

    for (let i = 0; i < 5; i++) {
      await withFileLock(TEMP_FILE, async () => {
        await fs.writeFile(TEMP_FILE, String(i), "utf-8");
      });
    }

    const value = await fs.readFile(TEMP_FILE, "utf-8");
    expect(value).toBe("4");
    await expect(fs.access(TEMP_LOCK)).rejects.toThrow();
  });
});
