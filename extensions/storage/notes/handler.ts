import { DatabaseSync } from "node:sqlite";

import type { Note } from "~/extensions/storage/notes/types.ts";
import type { TableHandler, TableHandlerOptions } from "~/extensions/storage/types.ts";

export class NoteHandler implements TableHandler<Note> {
  readonly database: DatabaseSync;

  constructor(options: TableHandlerOptions) {
    this.database = options.database;
  }

  async create(note: Note): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO notes (
          id, request_id, from_agent_id, to_agent_id, payload, in_reply_to, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        note.id,
        note.request_id,
        note.from_agent_id,
        note.to_agent_id,
        note.payload,
        note.in_reply_to ?? null,
        note.created_at,
      );
  }

  async update(note: Note): Promise<boolean> {
    const result = this.database
      .prepare(
        `UPDATE notes SET
          request_id = ?, from_agent_id = ?, to_agent_id = ?, payload = ?,
          in_reply_to = ?, created_at = ?
        WHERE id = ?`,
      )
      .run(
        note.request_id,
        note.from_agent_id,
        note.to_agent_id,
        note.payload,
        note.in_reply_to ?? null,
        note.created_at,
        note.id,
      ) as { changes: number };
    return result.changes > 0;
  }

  async get(identifier: string): Promise<Note | undefined> {
    const row = this.database
      .prepare("SELECT * FROM notes WHERE id = ?")
      .get(identifier) as unknown as RawNoteRow | undefined;
    return row ? toNote(row) : undefined;
  }

  async list(): Promise<Note[]> {
    const rows = this.database
      .prepare("SELECT * FROM notes ORDER BY created_at")
      .all() as unknown as RawNoteRow[];
    return rows.map(toNote);
  }

  async delete(identifier: string): Promise<boolean> {
    const result = this.database
      .prepare("DELETE FROM notes WHERE id = ?")
      .run(identifier) as { changes: number };
    return result.changes > 0;
  }

  async listByRecipient(requestId: string, toAgentId: string, limit = 100): Promise<Note[]> {
    const rows = this.database
      .prepare(
        `SELECT * FROM notes
         WHERE request_id = ? AND to_agent_id = ?
         ORDER BY created_at ASC
         LIMIT ?`,
      )
      .all(requestId, toAgentId, limit) as unknown as RawNoteRow[];
    return rows.map(toNote);
  }

  async countByRecipient(requestId: string, toAgentId: string): Promise<number> {
    const row = this.database
      .prepare(
        `SELECT COUNT(*) as count FROM notes
         WHERE request_id = ? AND to_agent_id = ?`,
      )
      .get(requestId, toAgentId) as unknown as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  }
}

type RawNoteRow = Record<keyof Note, string | number | null | undefined>;

function toNote(row: RawNoteRow): Note {
  return {
    id: String(row.id),
    request_id: String(row.request_id),
    from_agent_id: String(row.from_agent_id),
    to_agent_id: String(row.to_agent_id),
    payload: String(row.payload),
    in_reply_to: row.in_reply_to ? String(row.in_reply_to) : undefined,
    created_at: Number(row.created_at),
  };
}
