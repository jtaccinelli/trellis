import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { Migration } from "~/extensions/storage/migrations/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

/**
 * Migration tracker and runner.
 *
 * Uses a `migrations` table to record which schema versions have been applied,
 * then reads each table's `schema.sql` from its subfolder and executes the
 * statements in order.
 *
 * Migrations are explicit: callers (usually the storage adapter) must invoke
 * `apply()` after initializing the database connection.
 */
export class MigrationHandler implements TableHandler<Migration> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  /**
   * Apply pending schema files for the given table names.
   *
   * Each entry in `tables` is expected to resolve to a sibling subfolder
   * containing a `schema.sql` file (e.g. `../domains/schema.sql`).
   */
  async apply(tables: string[]): Promise<void> {
    const basePath = join(import.meta.dirname ?? "", "..");
    const createMigrationsTableSql = readFileSync(
      join(basePath, "migrations", "schema.sql"),
      "utf-8",
    );

    this.database.exec(createMigrationsTableSql);

    const row = this.database
      .prepare("SELECT MAX(version) as version FROM migrations")
      .get() as { version: number | null } | undefined;
    const currentVersion = row?.version ?? 0;

    for (let index = 0; index < tables.length; index++) {
      const version = index + 1;
      if (version <= currentVersion) continue;

      const table = tables[index];
      const schemaPath = join(basePath, table, "schema.sql");
      const sql = readFileSync(schemaPath, "utf-8");

      this.database.exec(sql);
      this.database
        .prepare(
          "INSERT INTO migrations (version, applied_at) VALUES (?, ?)",
        )
        .run(version, Date.now());
    }
  }

  async create(migration: Migration): Promise<void> {
    this.database
      .prepare(
        "INSERT INTO migrations (version, applied_at) VALUES (?, ?)",
      )
      .run(migration.version, migration.appliedAt);
  }

  async update(): Promise<boolean> {
    // Migration records are immutable once applied; updates are not supported.
    return false;
  }

  async get(version: string): Promise<Migration | undefined> {
    const row = this.database
      .prepare("SELECT * FROM migrations WHERE version = ?")
      .get(version) as unknown as
      | Record<keyof Migration, number>
      | undefined;
    return row ? toMigration(row) : undefined;
  }

  async list(): Promise<Migration[]> {
    const rows = this.database
      .prepare("SELECT * FROM migrations ORDER BY version")
      .all() as unknown as Record<keyof Migration, number>[];
    return rows.map(toMigration);
  }

  async delete(): Promise<boolean> {
    // Migration records are immutable once applied; deletions are not supported.
    return false;
  }
}

function toMigration(row: Record<keyof Migration, number>): Migration {
  return {
    version: row.version,
    appliedAt: row.appliedAt,
  };
}
