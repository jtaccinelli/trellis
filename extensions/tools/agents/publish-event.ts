/**
 * Tool: publish-event
 *
 * Publish a transient event to the Trellis WebSocket event bus. The event is
 * emitted locally on `pi.events` and forwarded to any connected agents matching
 * the routing options.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { EventManager } from "~/extensions/managers/types.ts";
import { formatToolResult } from "~/extensions/utils/index.ts";

const parameters = Type.Object({
  topic: Type.String({ description: "Event topic" }),
  payload: Type.Object({}, { additionalProperties: true, description: "JSON-serializable event payload" }),
  request_id: Type.Optional(Type.String({ description: "Send to every agent on this request id" })),
  target: Type.Optional(Type.String({ description: "Send only to this agent id" })),
  broadcast: Type.Optional(Type.Boolean({ description: "Send to every connected agent except the sender" })),
});

export interface PublishEventDetails {
  topic: string;
  request_id?: string;
  target?: string;
  broadcast?: boolean;
}

export function registerPublishEventTool(pi: ExtensionAPI, manager?: EventManager): void {
  pi.registerTool({
    name: "publish-event",
    label: "Publish Event",
    description: "Publish a transient event to the Trellis WebSocket event bus.",
    parameters,
    async execute(_toolCallId, params) {
      if (!manager) {
        throw new Error("WebSocket event bus is not available in this process.");
      }

      manager.publish(params.topic, params.payload, {
        requestId: params.request_id,
        target: params.target,
        broadcast: params.broadcast,
      });

      return formatToolResult<PublishEventDetails>(
        `Published event "${params.topic}".`,
        {
          topic: params.topic,
          request_id: params.request_id,
          target: params.target,
          broadcast: params.broadcast,
        },
      );
    },
  });
}
