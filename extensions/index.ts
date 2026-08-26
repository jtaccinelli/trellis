/**
 * Trellis — pi extension entry point.
 *
 * Factory distinguishes root mode from agent mode via TRELLIS_AGENT_ID and
 * TRELLIS_ROLE. Root mode registers tools, commands, lifecycle hooks, and the
 * deterministic runtime managers. Agent modes register only the ambient tools
 * required for that role.
 *
 * Tools use infinitive-verb-noun naming. Slash commands use gerund-noun naming.
 *   - scope-item, delegate-requirement, start-agent, stop-agent
 *   - leave-note, read-note, list-agents
 *   - create-domain, list-domains, delete-domain, get-domain, update-domain
 *   - list-scope, list-queue, resolve-conflict
 *   - managing-domains (command)
 *
 * Runtime managers live in `extensions/managers/`:
 *   - AgentEventManager — announces when an agent-mode process settles.
 *   - AgentManager — bundled agent catalog and child process lifecycle.
 *   - DomainManager — owns each domain's shared FIFO queue.
 *   - DomainManager — owns each domain's shared FIFO queue and completion events.
 *   - CoordinatorManager — coordinator lifecycle and request orchestration.
 */

import { fileURLToPath } from "node:url";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";
import { registerManagingDomainsCommand } from "~/extensions/commands/managing-domains.ts";
import {
  AgentEventManager,
  AgentManager,
  CoordinatorManager,
  DomainManager,
  WebSocketServerManager,
  WebSocketClientManager,
} from "~/extensions/managers/index.ts";
import {
  registerCreateDomainTool,
  registerDeleteDomainTool,
  registerGetDomainTool,
  registerListDomainsTool,
  registerUpdateDomainTool,
} from "~/extensions/tools/domains/index.ts";
import { registerStopAgentTool } from "~/extensions/tools/agents/stop-agent.ts";
import { registerListAgentsTool } from "~/extensions/tools/agents/list-agents.ts";
import { registerLeaveNoteTool } from "~/extensions/tools/agents/leave-note.ts";
import { registerReadNoteTool } from "~/extensions/tools/agents/read-note.ts";
import { registerStartAgentTool } from "~/extensions/tools/agents/start-agent.ts";
import { registerPublishEventTool } from "~/extensions/tools/agents/publish-event.ts";

import {
  TRELLIS_QUEUE_ITEM_COMPLETED,
  type TrellisQueueItemCompletedEvent,
} from "~/extensions/utils/events.ts";

function getExtensionPath(): string {
  return fileURLToPath(import.meta.url);
}

function createStorage(): SQLiteStorageAdapter {
  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  return new SQLiteStorageAdapter({ databasePath });
}

/** Set up an agent-mode Trellis process (coordinator, domain, or background). */
function initialiseAgentMode(pi: ExtensionAPI): void {
  const extensionPath = getExtensionPath();
  const storage = createStorage();

  const clientManager = new WebSocketClientManager({
    pi,
    token: process.env.TRELLIS_WS_TOKEN,
  });
  const agentManager = new AgentManager({
    extensionPath,
    storage,
  });

  // Announce when this agent comes to rest. One-shot agents then close
  // themselves; coordinators stay alive for the next RPC prompt.
  const agentEventManager = new AgentEventManager({
    pi,
    websocketManager: clientManager,
  });
  agentEventManager.mountEventListeners();

  registerStartAgentTool(pi, agentManager);
  registerStopAgentTool(pi, agentManager);
  registerLeaveNoteTool(pi, storage, clientManager);
  registerReadNoteTool(pi, storage);
  registerListAgentsTool(pi, storage, agentManager);
  registerPublishEventTool(pi, clientManager);

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
}

/** Set up the root Trellis process that owns managers, UI, and lifecycle. */
function initialiseRootMode(pi: ExtensionAPI): void {
  const extensionPath = getExtensionPath();
  const storage = createStorage();

  let serverManager: WebSocketServerManager | undefined;
  let agentManager: AgentManager | undefined;
  let domainManager: DomainManager | undefined;
  let coordinatorManager: CoordinatorManager | undefined;

  pi.on("session_start", async (_event, ctx) => {
    await storage.init();
    await storage.migrate();

    // Start the local inter-agent WebSocket server.
    serverManager = new WebSocketServerManager({ pi });
    const wsUrl = await serverManager.startServer();
    process.env.TRELLIS_WS_URL = wsUrl;
    process.env.TRELLIS_WS_TOKEN = serverManager.token;

    agentManager = new AgentManager({
      extensionPath,
      storage,
    });

    // Remove stale agent rows from a previous crashed session.
    // This table is a runtime process registry; it resets with the root session.
    const staleAgents = await storage.agents.list();
    for (const stale of staleAgents) {
      await storage.agents.delete(stale.id);
    }

    domainManager = new DomainManager({
      storage,
      pi,
      agentManager,
      websocketManager: serverManager,
    });
    coordinatorManager = new CoordinatorManager({
      storage,
      pi,
      agentManager,
      domainManager,
      websocketManager: serverManager,
    });

    // Domain taxonomy.
    registerCreateDomainTool(pi, storage);
    registerGetDomainTool(pi, storage);
    registerUpdateDomainTool(pi, storage);
    registerDeleteDomainTool(pi, storage);
    registerListDomainsTool(pi, storage);
    registerManagingDomainsCommand(pi, storage);

    // Agent lifecycle and messaging.
    registerStartAgentTool(pi, agentManager);
    registerStopAgentTool(pi, agentManager);
    registerLeaveNoteTool(pi, storage, serverManager);
    registerReadNoteTool(pi, storage);
    registerListAgentsTool(pi, storage, agentManager);
    registerPublishEventTool(pi, serverManager);

    ctx.ui.notify("Trellis loaded", "info");
  });

  // Route domain-manager completion notifications back to the coordinator.
  // Registered once outside session_start so duplicate listeners don't stack
  // if the session lifecycle fires multiple times.
  pi.events.on(TRELLIS_QUEUE_ITEM_COMPLETED, async (eventPayload: unknown) => {
    const payload = eventPayload as TrellisQueueItemCompletedEvent;
    await coordinatorManager!.onQueueItemCompleted(payload);
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

export default function extension(pi: ExtensionAPI): void {
  if (process.env.TRELLIS_AGENT_ID) {
    initialiseAgentMode(pi);
  } else {
    initialiseRootMode(pi);
  }
}
