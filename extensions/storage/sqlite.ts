/**
 * SQLite-backed storage adapter.
 *
 * Uses the Node.js built-in `node:sqlite` module (Node >= 22).
 *
 * Currently owns the `domains` table only. Additional entity handlers will be
 * mounted as `this.<table>` once their schemas are finalized.
 */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { DomainHandler } from "~/extensions/storage/domains/handler.ts";
import { MigrationHandler } from "~/extensions/storage/migrations/handler.ts";

export interface SQLiteStorageAdapterOptions {
  /** Directory or full file path. Defaults to `.pi/trellis/store.db`. */
  databasePath?: string;
}

export class SQLiteStorageAdapter implements StorageAdapter {
  readonly database: DatabaseSync;
  readonly domains: DomainHandler;
  readonly migrations: MigrationHandler;

  constructor(options: SQLiteStorageAdapterOptions = {}) {
    const databasePath = options.databasePath ?? ".pi/trellis/store.db";

    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new DatabaseSync(databasePath);
    this.domains = new DomainHandler({ database: this.database });
    this.migrations = new MigrationHandler({ database: this.database });
  }

  async init(): Promise<void> {
    // Connection is opened in the constructor. This hook is reserved for
    // verification steps (e.g. pragmas) without applying schema changes.
  }

  async migrate(): Promise<void> {
    await this.migrations.apply(["domains"]);
  }

  async close(): Promise<void> {
    this.database.close();
  }
}
