import { DatabaseSync } from "node:sqlite";

import type { Agent } from "~/extensions/storage/agents/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

export class AgentHandler implements TableHandler<Agent> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(agent: Agent): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO agents (
          id, parent_id, request_id, role, name, status, pid, task_preview,
          started_at, exited_at, exit_code, result_text, coordinator_id,
          domain_id, queue_item_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        agent.id,
        agent.parent_id ?? null,
        agent.request_id,
        agent.role,
        agent.name,
        agent.status,
        agent.pid ?? null,
        agent.task_preview ?? null,
        agent.started_at,
        agent.exited_at ?? null,
        agent.exit_code ?? null,
        agent.result_text ?? null,
        agent.coordinator_id ?? null,
        agent.domain_id ?? null,
        agent.queue_item_id ?? null,
      );
  }

  async update(agent: Agent): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE agents SET
          parent_id = ?, request_id = ?, role = ?, name = ?, status = ?, pid = ?,
          task_preview = ?, started_at = ?, exited_at = ?, exit_code = ?,
          result_text = ?, coordinator_id = ?, domain_id = ?, queue_item_id = ?
        WHERE id = ?`,
      )
      .run(
        agent.parent_id ?? null,
        agent.request_id,
        agent.role,
        agent.name,
        agent.status,
        agent.pid ?? null,
        agent.task_preview ?? null,
        agent.started_at,
        agent.exited_at ?? null,
        agent.exit_code ?? null,
        agent.result_text ?? null,
        agent.coordinator_id ?? null,
        agent.domain_id ?? null,
        agent.queue_item_id ?? null,
        agent.id,
      ) as { changes: number };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<Agent | undefined> {
    const row = this.database
      .prepare("SELECT * FROM agents WHERE id = ?")
      .get(identifier) as unknown as RawAgentRow | undefined;
    return row ? toAgent(row) : undefined;
  }

  async list(): Promise<Agent[]> {
    const rows = this.database
      .prepare("SELECT * FROM agents ORDER BY started_at DESC")
      .all() as unknown as RawAgentRow[];
    return rows.map(toAgent);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM agents WHERE id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }

  async listByRequest(requestId: string): Promise<Agent[]> {
    const rows = this.database
      .prepare("SELECT * FROM agents WHERE request_id = ? ORDER BY started_at DESC")
      .all(requestId) as unknown as RawAgentRow[];
    return rows.map(toAgent);
  }

  async listByParent(parentId: string): Promise<Agent[]> {
    const rows = this.database
      .prepare("SELECT * FROM agents WHERE parent_id = ? ORDER BY started_at DESC")
      .all(parentId) as unknown as RawAgentRow[];
    return rows.map(toAgent);
  }
}

type RawAgentRow = Record<keyof Agent, string | number | null | undefined>;

function toAgent(row: RawAgentRow): Agent {
  return {
    id: String(row.id),
    parent_id: row.parent_id ? String(row.parent_id) : undefined,
    request_id: String(row.request_id),
    role: String(row.role),
    name: String(row.name),
    status: String(row.status) as Agent["status"],
    pid: row.pid ? Number(row.pid) : undefined,
    task_preview: row.task_preview ? String(row.task_preview) : undefined,
    started_at: Number(row.started_at),
    exited_at: row.exited_at ? Number(row.exited_at) : undefined,
    exit_code: row.exit_code !== null && row.exit_code !== undefined ? Number(row.exit_code) : undefined,
    result_text: row.result_text ? String(row.result_text) : undefined,
    coordinator_id: row.coordinator_id ? String(row.coordinator_id) : undefined,
    domain_id: row.domain_id ? String(row.domain_id) : undefined,
    queue_item_id: row.queue_item_id ? String(row.queue_item_id) : undefined,
  };
}
