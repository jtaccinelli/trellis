import { DatabaseSync } from "node:sqlite";

import type { ScopeRequest } from "~/extensions/storage/requests/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

export class RequestHandler implements TableHandler<ScopeRequest> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(request: ScopeRequest): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO requests (
          request_id, description, status, coordinator_id
        ) VALUES (?, ?, ?, ?)`,
      )
      .run(request.request_id, request.description, request.status, request.coordinator_id);
  }

  async update(request: ScopeRequest): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE requests SET
          description = ?, status = ?, coordinator_id = ?
        WHERE request_id = ?`,
      )
      .run(request.description, request.status, request.coordinator_id, request.request_id) as {
        changes: number;
      };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<ScopeRequest | undefined> {
    const row = this.database
      .prepare("SELECT * FROM requests WHERE request_id = ?")
      .get(identifier) as unknown as RawRequestRow | undefined;
    return row ? toRequest(row) : undefined;
  }

  async list(): Promise<ScopeRequest[]> {
    const rows = this.database
      .prepare("SELECT * FROM requests ORDER BY request_id")
      .all() as unknown as RawRequestRow[];
    return rows.map(toRequest);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM requests WHERE request_id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }
}

type RawRequestRow = Record<keyof ScopeRequest, string>;

function toRequest(row: RawRequestRow): ScopeRequest {
  return {
    request_id: String(row.request_id),
    description: String(row.description),
    status: row.status as ScopeRequest["status"],
    coordinator_id: String(row.coordinator_id),
  };
}
