/**
 * Tool: listing-websocket-clients
 *
 * List the agents currently connected to the root WebSocket hub.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { WebSocketServerManager } from "~/extensions/managers/websocket-server-manager.ts";
import { formatToolResult } from "~/extensions/utils/index.ts";

const parameters = Type.Object({});

export interface ListingWebsocketClientsDetails {
  clients: string[];
  count: number;
}

export function registerListingWebsocketClientsTool(pi: ExtensionAPI, serverManager?: WebSocketServerManager): void {
  pi.registerTool({
    name: "listing-websocket-clients",
    label: "List WebSocket Clients",
    description: "List the agents currently connected to the root WebSocket hub.",
    parameters,
    async execute() {
      if (!serverManager) {
        throw new Error("WebSocket server is not available in this process.");
      }

      const clients = serverManager.getRegisteredAgentIds();
      return formatToolResult<ListingWebsocketClientsDetails>(
        `WebSocket clients: ${clients.length}`,
        { clients, count: clients.length },
      );
    },
  });
}
