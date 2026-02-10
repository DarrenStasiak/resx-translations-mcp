/**
 * File-level locking for safe concurrent read-modify-write cycles.
 *
 * Provides two layers of protection:
 *
 * 1. **In-process mutex** – serialises operations on the same file path
 *    within this Node process (handles concurrent MCP tool calls).
 *
 * 2. **Cross-process lockfile** – uses an exclusive-create (O_EXCL) `.lock`
 *    companion file so multiple MCP server instances don't collide.
 *
 * Usage:
 * ```ts
 * const result = await withFileLock(filePath, async () => {
 *   const data = await parseResxFile(filePath);
 *   // … mutate data …
 *   await writeResxFile(filePath, data);
 *   return data;
 * });
 * ```
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { logger } from "./logger.js";

// ── Configuration ───────────────────────────────────────────────────────

/** Lockfiles older than this are considered stale and will be removed. */
const LOCK_STALE_MS = 30_000;

/** Delay between retry attempts when the lockfile already exists. */
const LOCK_RETRY_DELAY_MS = 50;

/** Maximum number of retries before giving up on acquiring the lockfile. */
const LOCK_MAX_RETRIES = 100; // 100 × 50 ms = 5 s

// ── In-process mutex ────────────────────────────────────────────────────

/**
 * Map of normalised file paths → the tail of the current promise chain.
 * Each new operation appends itself to the chain so calls on the same file
 * are executed one-at-a-time within this process.
 */
const inProcessLocks = new Map<string, Promise<void>>();

// ── Lockfile helpers ────────────────────────────────────────────────────

function lockFilePath(filePath: string): string {
  return filePath + ".lock";
}

async function acquireLockFile(filePath: string): Promise<void> {
  const lockPath = lockFilePath(filePath);

  for (let attempt = 0; attempt < LOCK_MAX_RETRIES; attempt++) {
    try {
      // `wx` = write + exclusive-create – fails with EEXIST if the file
      // already exists.  This is an atomic check-and-create on all major
      // operating systems.
      const handle = await fs.open(lockPath, "wx");
      // Write our PID + timestamp so stale-lock detection is possible.
      await handle.writeFile(`${process.pid}\n${Date.now()}`, "utf-8");
      await handle.close();
      return;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error; // unexpected I/O error – propagate immediately
      }

      // Lockfile exists – check whether it is stale.
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          logger.info(`Removing stale lock file: ${lockPath}`);
          await fs.unlink(lockPath).catch(() => {
            /* another process may have removed it already */
          });
          continue; // retry immediately
        }
      } catch {
        // The lock file disappeared between our open and stat – retry.
        continue;
      }

      // Lock held by another process/call – back off and retry.
      await delay(LOCK_RETRY_DELAY_MS);
    }
  }

  throw new Error(
    `Failed to acquire lock for ${filePath} after ${LOCK_MAX_RETRIES} attempts (${(LOCK_MAX_RETRIES * LOCK_RETRY_DELAY_MS) / 1000}s).`,
  );
}

async function releaseLockFile(filePath: string): Promise<void> {
  await fs.unlink(lockFilePath(filePath)).catch(() => {
    /* best-effort – may already be gone */
  });
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Execute `fn` while holding an exclusive lock on `filePath`.
 *
 * Guarantees that:
 * - Only one call at a time within this process operates on the file
 *   (in-process promise chain).
 * - Only one process at a time operates on the file (cross-process
 *   lockfile with stale-lock recovery).
 */
export async function withFileLock<T>(
  filePath: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = path.resolve(filePath);

  // ── 1. In-process serialisation ──────────────────────────────────────
  // Chain this operation after whatever is currently pending for the same
  // file.  If there is nothing pending we chain after a resolved promise.
  const previous = inProcessLocks.get(key) ?? Promise.resolve();

  let releaseMutex!: () => void;
  const gate = new Promise<void>((r) => {
    releaseMutex = r;
  });
  inProcessLocks.set(key, gate);

  // Wait for the previous operation to finish (ignore its outcome –
  // a failure in one call must not block subsequent ones).
  await previous.catch(() => {});

  // ── 2. Cross-process lockfile ────────────────────────────────────────
  try {
    await acquireLockFile(key);
    try {
      return await fn();
    } finally {
      await releaseLockFile(key);
    }
  } finally {
    releaseMutex();
    // Tidy up the map if no-one else has queued behind us.
    if (inProcessLocks.get(key) === gate) {
      inProcessLocks.delete(key);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
