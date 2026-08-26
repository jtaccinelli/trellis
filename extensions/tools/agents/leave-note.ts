/**
 * Tool: leave-note
 *
 * Leave a durable one-to-one note for another agent. The receiver discovers
 * it via `read-note`. Used for steering notes and domain-manager completion
 * notifications.
 */

import { randomUUID } from "node:crypto";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";
import type { EventManager } from "~/extensions/managers/types.ts";
import { formatToolResult, json } from "~/extensions/utils/index.ts";
import { TRELLIS_NOTE_SENT } from "~/extensions/utils/events.ts";

const parameters = Type.Object({
  request_id: Type.String({ description: "Request id this note belongs to" }),
  to_agent_id: Type.String({ description: "Recipient agent id" }),
  payload: Type.Object({}, { additionalProperties: true, description: "JSON-serializable note payload" }),
  in_reply_to: Type.Optional(Type.String({ description: "Note id this replies to" })),
});

export interface LeaveNoteDetails {
  note_id: string;
  request_id: string;
  to_agent_id: string;
}

export function registerLeaveNoteTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
  eventManager?: EventManager,
): void {
  pi.registerTool({
    name: "leave-note",
    label: "Leave Note",
    description: "Leave a durable one-to-one note for another agent.",
    parameters,
    async execute(_toolCallId, params) {
      const fromAgentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const note = {
        id: `trellis:note:${randomUUID()}`,
        request_id: params.request_id,
        from_agent_id: fromAgentId,
        to_agent_id: params.to_agent_id,
        payload: json(params.payload),
        in_reply_to: params.in_reply_to,
        created_at: Date.now(),
      };

      await storage.notes.create(note);

      const eventPayload = {
        noteId: note.id,
        requestId: note.request_id,
        fromAgentId: note.from_agent_id,
        toAgentId: note.to_agent_id,
        payload: params.payload,
      };

      pi.events.emit(TRELLIS_NOTE_SENT, eventPayload);
      eventManager?.publish(TRELLIS_NOTE_SENT, eventPayload, {
        target: note.to_agent_id,
        requestId: note.request_id,
      });

      return formatToolResult<LeaveNoteDetails>(
        `Left note "${note.id}" for "${params.to_agent_id}".`,
        {
          note_id: note.id,
          request_id: params.request_id,
          to_agent_id: params.to_agent_id,
        },
      );
    },
  });
}
