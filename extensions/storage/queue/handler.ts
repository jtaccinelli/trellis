import { DatabaseSync } from "node:sqlite";

import type { QueueItem } from "~/extensions/storage/queue/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

export class QueueHandler implements TableHandler<QueueItem> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(item: QueueItem): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO queue_items (
          id, domain_id, requirement_id, enqueued_by_coordinator_id,
          status, domain_agent_id, result_payload, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        item.id,
        item.domain_id,
        item.requirement_id,
        item.enqueued_by_coordinator_id,
        item.status,
        item.domain_agent_id ?? null,
        item.result_payload ?? null,
        item.priority,
        item.created_at,
      );
  }

  async update(item: QueueItem): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE queue_items SET
          domain_id = ?, requirement_id = ?, enqueued_by_coordinator_id = ?,
          status = ?, domain_agent_id = ?, result_payload = ?, priority = ?, created_at = ?
        WHERE id = ?`,
      )
      .run(
        item.domain_id,
        item.requirement_id,
        item.enqueued_by_coordinator_id,
        item.status,
        item.domain_agent_id ?? null,
        item.result_payload ?? null,
        item.priority,
        item.created_at,
        item.id,
      ) as { changes: number };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<QueueItem | undefined> {
    const row = this.database
      .prepare("SELECT * FROM queue_items WHERE id = ?")
      .get(identifier) as unknown as RawQueueRow | undefined;
    return row ? toQueueItem(row) : undefined;
  }

  async list(): Promise<QueueItem[]> {
    const rows = this.database
      .prepare("SELECT * FROM queue_items ORDER BY created_at")
      .all() as unknown as RawQueueRow[];
    return rows.map(toQueueItem);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM queue_items WHERE id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }

  async peekNextByDomain(domainId: string, status: QueueItem["status"]): Promise<QueueItem | undefined> {
    const row = this.database
      .prepare(
        `SELECT * FROM queue_items
         WHERE domain_id = ? AND status = ?
         ORDER BY priority DESC, created_at ASC
         LIMIT 1`,
      )
      .get(domainId, status) as unknown as RawQueueRow | undefined;
    return row ? toQueueItem(row) : undefined;
  }

  async listByDomain(domainId: string): Promise<QueueItem[]> {
    const rows = this.database
      .prepare("SELECT * FROM queue_items WHERE domain_id = ? ORDER BY created_at")
      .all(domainId) as unknown as RawQueueRow[];
    return rows.map(toQueueItem);
  }

  async listByRequirement(requirementId: string): Promise<QueueItem[]> {
    const rows = this.database
      .prepare("SELECT * FROM queue_items WHERE requirement_id = ? ORDER BY created_at")
      .all(requirementId) as unknown as RawQueueRow[];
    return rows.map(toQueueItem);
  }
}

type RawQueueRow = Record<keyof QueueItem, string | number | null | undefined>;

function toQueueItem(row: RawQueueRow): QueueItem {
  return {
    id: String(row.id),
    domain_id: String(row.domain_id),
    requirement_id: String(row.requirement_id),
    enqueued_by_coordinator_id: String(row.enqueued_by_coordinator_id),
    status: row.status as QueueItem["status"],
    domain_agent_id: row.domain_agent_id ? String(row.domain_agent_id) : undefined,
    result_payload: row.result_payload ? String(row.result_payload) : undefined,
    priority: Number(row.priority),
    created_at: Number(row.created_at),
  };
}
