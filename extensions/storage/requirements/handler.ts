import { DatabaseSync } from "node:sqlite";

import type { Requirement } from "~/extensions/storage/requirements/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";
import { json, parseJson } from "~/extensions/utils/index.ts";

export class RequirementHandler implements TableHandler<Requirement> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(requirement: Requirement): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO requirements (
          id, request_id, description, domain_id, parent_requirement_id,
          status, owned_scope, contracts, child_requirement_ids,
          reassignment_count, escalation_reason, resolution_payload, created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        requirement.id,
        requirement.request_id,
        requirement.description,
        requirement.domain_id,
        requirement.parent_requirement_id ?? null,
        requirement.status,
        requirement.owned_scope ?? null,
        json(requirement.contracts),
        json(requirement.child_requirement_ids),
        requirement.reassignment_count,
        requirement.escalation_reason ?? null,
        requirement.resolution_payload ?? null,
        requirement.created_at,
        requirement.resolved_at ?? null,
      );
  }

  async update(requirement: Requirement): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE requirements SET
          request_id = ?, description = ?, domain_id = ?, parent_requirement_id = ?,
          status = ?, owned_scope = ?, contracts = ?, child_requirement_ids = ?,
          reassignment_count = ?, escalation_reason = ?, resolution_payload = ?, created_at = ?, resolved_at = ?
        WHERE id = ?`,
      )
      .run(
        requirement.request_id,
        requirement.description,
        requirement.domain_id,
        requirement.parent_requirement_id ?? null,
        requirement.status,
        requirement.owned_scope ?? null,
        json(requirement.contracts),
        json(requirement.child_requirement_ids),
        requirement.reassignment_count,
        requirement.escalation_reason ?? null,
        requirement.resolution_payload ?? null,
        requirement.created_at,
        requirement.resolved_at ?? null,
        requirement.id,
      ) as { changes: number };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<Requirement | undefined> {
    const row = this.database
      .prepare("SELECT * FROM requirements WHERE id = ?")
      .get(identifier) as unknown as RawRequirementRow | undefined;
    return row ? toRequirement(row) : undefined;
  }

  async list(): Promise<Requirement[]> {
    const rows = this.database
      .prepare("SELECT * FROM requirements ORDER BY created_at")
      .all() as unknown as RawRequirementRow[];
    return rows.map(toRequirement);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM requirements WHERE id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }

  async listByRequest(requestId: string): Promise<Requirement[]> {
    const rows = this.database
      .prepare("SELECT * FROM requirements WHERE request_id = ? ORDER BY created_at")
      .all(requestId) as unknown as RawRequirementRow[];
    return rows.map(toRequirement);
  }

  async listByDomain(domainId: string): Promise<Requirement[]> {
    const rows = this.database
      .prepare("SELECT * FROM requirements WHERE domain_id = ? ORDER BY created_at")
      .all(domainId) as unknown as RawRequirementRow[];
    return rows.map(toRequirement);
  }
}

type RawRequirementRow = Record<keyof Requirement, string | number | null | undefined>;

function toRequirement(row: RawRequirementRow): Requirement {
  return {
    id: String(row.id),
    request_id: String(row.request_id),
    description: String(row.description),
    domain_id: String(row.domain_id),
    parent_requirement_id: row.parent_requirement_id ? String(row.parent_requirement_id) : undefined,
    status: row.status as Requirement["status"],
    owned_scope: row.owned_scope ? String(row.owned_scope) : undefined,
    contracts: parseJson<Requirement["contracts"]>(row.contracts as string),
    child_requirement_ids: parseJson<Requirement["child_requirement_ids"]>(row.child_requirement_ids as string),
    reassignment_count: Number(row.reassignment_count),
    escalation_reason: row.escalation_reason ? String(row.escalation_reason) : undefined,
    resolution_payload: row.resolution_payload ? String(row.resolution_payload) : undefined,
    created_at: Number(row.created_at),
    resolved_at: row.resolved_at ? Number(row.resolved_at) : undefined,
  };
}
