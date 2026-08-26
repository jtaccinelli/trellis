/**
 * Trellis — pi extension entry point.
 *
 * Factory distinguishes root mode from agent mode via TRELLIS_AGENT_ID and
 * TRELLIS_ROLE. Root mode registers tools, commands, lifecycle hooks, and the
 * deterministic runtime managers. Agent modes register only the ambient tools
 * required for that role.
 *
 * Tools and commands use gerund-noun naming (no trellis_ prefix):
 *   - scoping-item, delegating-requirement, starting-agent, stopping-agent
 *   - sending-message, receiving-message, listing-agents
 *   - creating-domain, listing-domains
 *   - listing-scope, listing-queue, resolving-conflict
 *   - /scoping-item, /building-item, /reviewing-item, /cataloging-project, /inspecting-tree
 *
 * Runtime managers live in `extensions/managers/`:
 *   - AgentManager — bundled agent catalog and child process lifecycle.
 *   - DomainManager — owns each domain's shared FIFO queue.
 *   - NotificationManager — pushes domain-agent completion to coordinators.
 *   - CoordinatorManager — coordinator lifecycle and request orchestration.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerManagingDomainsCommand } from "~/extensions/commands/managing-domains.ts";
import {
  AgentManager,
  CoordinatorManager,
  NotificationManager,
  DomainManager,
  WebSocketServerManager,
  WebSocketClientManager,
} from "~/extensions/managers/index.ts";
import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";
import {
  registerCreatingDomainTool,
  registerDeletingDomainTool,
  registerGettingDomainTool,
  registerListingDomainsTool,
  registerUpdatingDomainTool,
} from "~/extensions/tools/domains/index.ts";
import { registerStoppingAgentTool } from "~/extensions/tools/agents/stopping-agent.ts";
import { registerListingAgentsTool } from "~/extensions/tools/agents/listing-agents.ts";
import { registerReceivingMessageTool } from "~/extensions/tools/agents/receiving-message.ts";
import { registerSendingMessageTool } from "~/extensions/tools/agents/sending-message.ts";
import { registerStartingAgentTool } from "~/extensions/tools/agents/starting-agent.ts";
import { registerSendingAgentPromptTool } from "~/extensions/tools/agents/sending-agent-prompt.ts";
import { registerPublishingEventTool } from "~/extensions/tools/agents/publishing-event.ts";
import { registerListingWebsocketClientsTool } from "~/extensions/tools/agents/listing-websocket-clients.ts";
import { registerListingQueueTool } from "~/extensions/tools/queue/listing-queue.ts";
import { registerDelegatingRequirementTool } from "~/extensions/tools/scoping/delegating-requirement.ts";
import { registerListingScopeTool } from "~/extensions/tools/scoping/listing-scope.ts";
import { registerResolvingConflictTool } from "~/extensions/tools/scoping/resolving-conflict.ts";
import { registerScopingItemTool } from "~/extensions/tools/scoping/scoping-item.ts";

function getExtensionPath(): string {
  return fileURLToPath(import.meta.url);
}

export default function extension(pi: ExtensionAPI) {
  const isAgentMode = Boolean(process.env.TRELLIS_AGENT_ID);
  const extensionPath = getExtensionPath();

  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  const storage = new SQLiteStorageAdapter({ databasePath });

  if (isAgentMode) {
    // Agent modes get only ambient, read/messaging tools. The root extension
    // owns the domain manager and the delegating-requirement tool.
    const clientManager = new WebSocketClientManager({
      pi,
      token: process.env.TRELLIS_WS_TOKEN,
    });
    const agentManager = new AgentManager({ extensionPath, events: pi.events, storage, websocketManager: clientManager });

    registerStartingAgentTool(pi, agentManager);
    registerStoppingAgentTool(pi, agentManager);
    registerSendingMessageTool(pi, storage);
    registerReceivingMessageTool(pi, storage);
    registerListingAgentsTool(pi, storage, agentManager);
    registerSendingAgentPromptTool(pi, agentManager);
    registerPublishingEventTool(pi, clientManager);
    registerListingQueueTool(pi, storage);
    registerListingScopeTool(pi, storage);
    registerResolvingConflictTool(pi, storage);

    pi.on("session_start", async () => {
      await storage.init();
      await storage.migrate();

      const wsUrl = process.env.TRELLIS_WS_URL;
      if (wsUrl) {
        // Connect in the background so a slow/unreachable server never blocks
        // the agent's first turn. Pending publishes are queued until connected.
        clientManager.openConnection(wsUrl).catch(() => {
          // WS connection is best-effort; the agent still functions over SQLite.
        });
      }
    });

    pi.on("session_shutdown", async () => {
      // Agent mode contributes agent rows to the shared runtime registry.
      // Root mode owns cleanup when the root session ends.
      clientManager.closeConnection();
      await storage.close();
    });

    return;
  }

  // Root mode below.
  let serverManager: WebSocketServerManager | undefined;
  let agentManager: AgentManager | undefined;
  let notificationManager: NotificationManager | undefined;
  let domainManager: DomainManager | undefined;
  let coordinatorManager: CoordinatorManager | undefined;

  pi.on("session_start", async (_event, ctx) => {
    await storage.init();
    await storage.migrate();

    // Ensure child agents inherit a stable session-start timestamp for log directories.
    process.env.TRELLIS_SESSION_START = String(Date.now());

    // Start the local inter-agent WebSocket server.
    serverManager = new WebSocketServerManager({ pi });
    const wsUrl = await serverManager.startServer();
    process.env.TRELLIS_WS_URL = wsUrl;
    process.env.TRELLIS_WS_TOKEN = serverManager.token;

    agentManager = new AgentManager({ extensionPath, events: pi.events, storage, websocketManager: serverManager });

    // Remove stale agent rows from a previous crashed session.
    // This table is a runtime process registry; it resets with the root session.
    const staleAgents = await storage.agents.list();
    for (const stale of staleAgents) {
      await storage.agents.delete(stale.id);
    }

    notificationManager = new NotificationManager({ storage, pi, websocketManager: serverManager });
    domainManager = new DomainManager({
      storage,
      pi,
      agentManager,
      notificationManager,
    });
    coordinatorManager = new CoordinatorManager({
      storage,
      pi,
      agentManager,
      domainManager,
      notificationManager,
      websocketManager: serverManager,
    });

    // Domain taxonomy.
    registerCreatingDomainTool(pi, storage);
    registerGettingDomainTool(pi, storage);
    registerUpdatingDomainTool(pi, storage);
    registerDeletingDomainTool(pi, storage);
    registerListingDomainsTool(pi, storage);
    registerManagingDomainsCommand(pi, storage);

    // Planning / scoping.
    registerScopingItemTool(pi, storage, coordinatorManager, domainManager);
    registerDelegatingRequirementTool(pi, storage, domainManager);
    registerListingScopeTool(pi, storage);
    registerResolvingConflictTool(pi, storage);

    // Queue inspection.
    registerListingQueueTool(pi, storage);

    // Agent lifecycle and messaging.
    registerStartingAgentTool(pi, agentManager);
    registerStoppingAgentTool(pi, agentManager);
    registerSendingMessageTool(pi, storage);
    registerReceivingMessageTool(pi, storage);
    registerListingAgentsTool(pi, storage, agentManager);
    registerSendingAgentPromptTool(pi, agentManager);
    registerPublishingEventTool(pi, serverManager);
    registerListingWebsocketClientsTool(pi, serverManager);

    // Route domain-manager completion notifications back to the coordinator.
    pi.events.on("trellis:queue_item_completed", async (eventPayload: unknown) => {
      const payload = eventPayload as {
        requestId: string;
        queueItemId: string;
        coordinatorId: string;
        failed: boolean;
      };
      await coordinatorManager!.onQueueItemCompleted(payload);
    });

    pi.events.on("trellis:agent_closed", (eventPayload: unknown) => {
      const payload = eventPayload as {
        agentId: string;
        agentName: string;
        role: string;
        requestId: string;
        exitCode: number;
        resultText?: string;
      };

      pi.sendMessage(
        {
          customType: "trellis:agent_closed",
          content: `Trellis agent "${payload.agentName}" (${payload.role}, ${payload.agentId}) closed. Use the receiving-message tool to check for messages addressed to you.`,
          display: true,
          details: {
            agentId: payload.agentId,
            agentName: payload.agentName,
            role: payload.role,
            requestId: payload.requestId,
            exitCode: payload.exitCode,
            resultText: (payload.resultText || "").slice(0, 2000),
          },
        },
        { deliverAs: "followUp", triggerTurn: true },
      );
    });

    ctx.ui.notify("Trellis loaded", "info");
  });

  pi.on("session_shutdown", async () => {
    // Stop the inter-agent WebSocket server.
    serverManager?.stopServer();

    // Clear the runtime agent registry on root session exit.
    const remainingAgents = await storage.agents.list();
    for (const agent of remainingAgents) {
      await storage.agents.delete(agent.id);
    }
    await storage.close();
  });
}
