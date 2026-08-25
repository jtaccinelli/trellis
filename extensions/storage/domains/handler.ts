import { DatabaseSync } from "node:sqlite";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

import { json, parseJson } from "~/extensions/utils.ts";

export class DomainHandler implements TableHandler<Domain> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(domain: Domain): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO domains (
          id, name, description, remit, exclusions
        ) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        domain.id,
        domain.name,
        domain.description,
        domain.remit,
        json(domain.exclusions),
      );
  }

  async update(domain: Domain): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE domains SET
          name = ?, description = ?, remit = ?, exclusions = ?
        WHERE id = ?`,
      )
      .run(
        domain.name,
        domain.description,
        domain.remit,
        json(domain.exclusions),
        domain.id,
      ) as { changes: number };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<Domain | undefined> {
    const row = this.database
      .prepare("SELECT * FROM domains WHERE id = ?")
      .get(identifier) as unknown as
      | Record<keyof Domain, string>
      | undefined;
    return row ? toDomain(row) : undefined;
  }

  async list(): Promise<Domain[]> {
    const rows = this.database
      .prepare("SELECT * FROM domains ORDER BY name")
      .all() as unknown as Record<keyof Domain, string>[];
    return rows.map(toDomain);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM domains WHERE id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }
}

function toDomain(row: Record<keyof Domain, string>): Domain {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    remit: row.remit,
    exclusions: parseJson<string[]>(row.exclusions),
  };
}
