/**
 * Tool: read-note
 *
 * Poll the caller's own inbox. Long-lived agents use this to discover
 * steering notes and domain-manager completion notifications.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";
import { formatToolResult, parseJson } from "~/extensions/utils/index.ts";

const parameters = Type.Object({
  request_id: Type.String({ description: "Request id to read notes for" }),
});

export interface ReadNoteDetails {
  request_id: string;
  note?: unknown;
  remaining_count: number;
}

export function registerReadNoteTool(pi: ExtensionAPI, storage: StorageAdapter): void {
  pi.registerTool({
    name: "read-note",
    label: "Read Note",
    description: "Read the next durable note addressed to the current agent for a request.",
    parameters,
    async execute(_toolCallId, params) {
      const toAgentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const notes = await storage.notes.listByRecipient(
        params.request_id,
        toAgentId,
        1,
      );
      const note = notes[0];

      if (!note) {
        return formatToolResult<ReadNoteDetails>(
          `No notes for "${toAgentId}" in request "${params.request_id}".`,
          {
            request_id: params.request_id,
            remaining_count: 0,
          },
        );
      }

      await storage.notes.delete(note.id);
      const remainingCount = await storage.notes.countByRecipient(
        params.request_id,
        toAgentId,
      );

      const parsedNote = {
        id: note.id,
        from_agent_id: note.from_agent_id,
        to_agent_id: note.to_agent_id,
        request_id: note.request_id,
        payload: parseJson(note.payload),
        in_reply_to: note.in_reply_to,
        created_at: note.created_at,
      };

      const content =
        `Note from "${parsedNote.from_agent_id}":\n${JSON.stringify(
          parsedNote.payload,
          null,
          2,
        )}` +
        (remainingCount > 0
          ? `\n\n${remainingCount} note(s) remain in your inbox for this request. Call read-note again to read the next one.`
          : "");

      return formatToolResult<ReadNoteDetails>(content, {
        request_id: params.request_id,
        note: parsedNote,
        remaining_count: remainingCount,
      });
    },
  });
}
