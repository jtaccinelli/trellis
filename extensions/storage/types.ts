import type { DatabaseSync } from "node:sqlite";

import type { AgentHandler } from "~/extensions/storage/agents/handler.ts";
import type { DomainHandler } from "~/extensions/storage/domains/handler.ts";
import type { MigrationHandler } from "~/extensions/storage/migrations/handler.ts";
import type { NoteHandler } from "~/extensions/storage/notes/handler.ts";
import type { QueueHandler } from "~/extensions/storage/queue/handler.ts";
import type { RequirementHandler } from "~/extensions/storage/requirements/handler.ts";
import type { RequestHandler } from "~/extensions/storage/requests/handler.ts";

/**
 * Options for constructing a table handler.
 *
 * All handlers share the same database connection and operate on it directly.
 */
export interface TableHandlerOptions {
  database: DatabaseSync;
}

/**
 * Generic CRUD contract for a single table.
 *
 * Type parameter T is the public, parsed entity type. Row serialization and
 * deserialization live in the concrete handler implementation.
 *
 * Methods:
 *   create — insert a new entity.
 *   update — replace an existing entity by identifier.
 *   get    — fetch one entity by its identifier.
 *   list   — return all entities in a stable order.
 */
export interface TableHandler<T> {
  create(entity: T): Promise<void>;
  update(entity: T): Promise<boolean>;
  get(identifier: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  delete(identifier: string): Promise<boolean>;
}

/**
 * Storage adapter contract.
 *
 * Plugin code depends only on this interface. Backends:
 *   - SQLite (default): project-local `.pi/trellis/store.db`
 *   - Cloudflare D1/KV (future)
 *
 * Lifecycle:
 *   init    — open the connection and verify it is usable (does not run migrations).
 *   migrate — apply migrations explicitly, only after reviewing the schema.
 *   close   — gracefully close any open connections.
 *
 * Namespaced handlers:
 *   agents       — registry of every spawned agent across the agent tree.
 *   domains      — CRUD operations for the domains table.
 *   requests     — scoping requests (formerly sessions).
 *   requirements — scope requirements inside a request.
 *   queue        — per-domain FIFO work queue.
 *   notes        — one-to-one agent notifications.
 *   migrations   — tracks applied schema versions and runs the migration runner.
 */
export interface StorageAdapter {
  init(): Promise<void>;
  migrate(): Promise<void>;
  close(): Promise<void>;
  agents: AgentHandler;
  domains: DomainHandler;
  requests: RequestHandler;
  requirements: RequirementHandler;
  queue: QueueHandler;
  notes: NoteHandler;
  migrations: MigrationHandler;
}
