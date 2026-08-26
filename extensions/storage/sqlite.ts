/**
 * SQLite-backed storage adapter.
 *
 * Uses the Node.js built-in `node:sqlite` module (Node >= 22).
 */

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { AgentHandler } from "~/extensions/storage/agents/handler.ts";
import { DomainHandler } from "~/extensions/storage/domains/handler.ts";
import { MigrationHandler } from "~/extensions/storage/migrations/handler.ts";
import { NoteHandler } from "~/extensions/storage/notes/handler.ts";
import { QueueHandler } from "~/extensions/storage/queue/handler.ts";
import { RequirementHandler } from "~/extensions/storage/requirements/handler.ts";
import { RequestHandler } from "~/extensions/storage/requests/handler.ts";

export interface SQLiteStorageAdapterOptions {
  /** Directory or full file path. Defaults to `.pi/trellis/store.db`. */
  databasePath?: string;
}

export class SQLiteStorageAdapter implements StorageAdapter {
  readonly database: DatabaseSync;
  readonly agents: AgentHandler;
  readonly domains: DomainHandler;
  readonly requests: RequestHandler;
  readonly requirements: RequirementHandler;
  readonly queue: QueueHandler;
  readonly notes: NoteHandler;
  readonly migrations: MigrationHandler;

  constructor(options: SQLiteStorageAdapterOptions = {}) {
    const databasePath = options.databasePath ?? ".pi/trellis/store.db";

    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new DatabaseSync(databasePath);
    this.agents = new AgentHandler({ database: this.database });
    this.domains = new DomainHandler({ database: this.database });
    this.requests = new RequestHandler({ database: this.database });
    this.requirements = new RequirementHandler({ database: this.database });
    this.queue = new QueueHandler({ database: this.database });
    this.notes = new NoteHandler({ database: this.database });
    this.migrations = new MigrationHandler({ database: this.database });
  }

  async init(): Promise<void> {
    // Connection is opened in the constructor. This hook is reserved for
    // verification steps (e.g. pragmas) without applying schema changes.
  }

  async migrate(): Promise<void> {
    // The agents table is a transient runtime registry. If its schema has
    // changed (e.g. a removed column), drop it and re-create it directly.
    const hasLogPath = this.database
      .prepare(
        "SELECT name FROM pragma_table_info('agents') WHERE name = 'log_path'",
      )
      .get() as { name: string } | undefined;
    if (hasLogPath) {
      this.database.exec("DROP TABLE IF EXISTS agents;");
      const agentsSchema = readAgentsSchema();
      this.database.exec(agentsSchema);
    }

    await this.migrations.apply([
      "domains",
      "requests",
      "requirements",
      "queue",
      "notes",
      "agents",
    ]);
  }

  async close(): Promise<void> {
    this.database.close();
  }
}

function readAgentsSchema(): string {
  // When bundled by esbuild, import.meta.dirname is the bundle output folder
  // (e.g. dist/extensions). When run via tsx, it is the source file's folder
  // (e.g. extensions/storage). Try both mirrored layouts.
  const candidates = [
    join(import.meta.dirname ?? "", "agents", "schema.sql"),
    join(import.meta.dirname ?? "", "..", "agents", "schema.sql"),
  ];
  for (const candidate of candidates) {
    try {
      return readFileSync(candidate, "utf-8");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }
  throw new Error(
    `Could not locate agents/schema.sql (tried ${candidates.join(", ")})`,
  );
}
