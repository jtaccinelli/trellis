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
import path from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerManagingDomainsCommand } from "~/extensions/commands/managing-domains.ts";
import {
  AgentEventManager,
  AgentManager,
  CoordinatorManager,
  DomainManager,
  WebSocketServerManager,
  WebSocketClientManager,
} from "~/extensions/managers/index.ts";
import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";
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
import { registerListWebsocketClientsTool } from "~/extensions/tools/agents/list-websocket-clients.ts";
import { registerListQueueTool } from "~/extensions/tools/queue/list-queue.ts";
import { registerDelegateRequirementTool } from "~/extensions/tools/scoping/delegate-requirement.ts";
import { registerListScopeTool } from "~/extensions/tools/scoping/list-scope.ts";
import { registerResolveConflictTool } from "~/extensions/tools/scoping/resolve-conflict.ts";
import { registerScopeItemTool } from "~/extensions/tools/scoping/scope-item.ts";
import {
  TRELLIS_AGENT_CLOSED,
  TRELLIS_AGENT_SETTLED,
  TRELLIS_AGENT_SPAWNED,
  TRELLIS_COORDINATOR_STARTED,
  TRELLIS_COORDINATOR_UPDATED,
  TRELLIS_NOTE_SENT,
  TRELLIS_QUEUE_ITEM_COMPLETED,
  type TrellisAgentClosedEvent,
  type TrellisNoteSentEvent,
  type TrellisAgentSettledEvent,
  type TrellisAgentSpawnedEvent,
  type TrellisCoordinatorStartedEvent,
  type TrellisCoordinatorUpdatedEvent,
  type TrellisEventTopic,
  type TrellisQueueItemCompletedEvent,
} from "~/extensions/utils/events.ts";

function getExtensionPath(): string {
  return fileURLToPath(import.meta.url);
}

function createStorage(): SQLiteStorageAdapter {
  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  return new SQLiteStorageAdapter({ databasePath });
}

interface BeforeProviderHeadersEvent {
  type: "before_provider_headers";
  headers: Record<string, string | null>;
}

/**
 * Tag outgoing AI provider requests with Trellis agent identifiers.
 *
 * This makes it possible to inspect/filter individual requests in the
 * Cloudflare AI Gateway logs, distinguishing requests from the root process
 * from requests made by spawned subagents.
 */
function tagProviderHeaders(pi: ExtensionAPI): void {
  pi.on("before_provider_headers", (event: BeforeProviderHeadersEvent) => {
    const agentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
    const role = process.env.TRELLIS_ROLE ?? "root";
    const agentName = process.env.TRELLIS_AGENT_NAME;
    const requestId = process.env.TRELLIS_REQUEST_ID;

    event.headers["X-Trellis-Agent-Id"] = agentId;
    event.headers["X-Trellis-Role"] = role;
    if (agentName) {
      event.headers["X-Trellis-Agent-Name"] = agentName;
    }
    if (requestId) {
      event.headers["X-Trellis-Request-Id"] = requestId;
    }

    const metadataHeader = event.headers["cf-aig-metadata"];
    if (metadataHeader) {
      try {
        const metadata = JSON.parse(metadataHeader);
        event.headers["cf-aig-metadata"] = JSON.stringify({
          ...metadata,
          trellisAgentId: agentId,
          trellisRole: role,
          trellisRequestId: requestId,
        });
      } catch {
        // Keep the existing header if it isn't valid JSON.
      }
    }
  });
}


/**
 * Log a Trellis event to the root session transcript for observability.
 *
 * Used during development/testing to confirm that events published over the
 * WebSocket bus are being received by the root process. Set `triggerTurn`
 * to false so the events are displayed without causing an agent turn.
 */
function logTrellisEvent(
  pi: ExtensionAPI,
  topic: TrellisEventTopic,
  payload: unknown,
  options?: { content?: string },
): void {
  const message = {
    customType: topic,
    content: options?.content ?? `Trellis event: ${topic}`,
    display: true,
    details: payload,
  };
  const deliverOptions = { deliverAs: "followUp" as const, triggerTurn: false as const };

  // Defer so the log surfaces after the current tool turn finishes. Without
  // this, events emitted synchronously inside a tool execute() callback can
  // be suppressed by the in-flight assistant message.
  setImmediate(() => {
    pi.sendMessage(message, deliverOptions);
  });
}

/** Set up an agent-mode Trellis process (coordinator, domain, or background). */
function initialiseAgentMode(pi: ExtensionAPI): void {
  const extensionPath = getExtensionPath();
  const storage = createStorage();

  tagProviderHeaders(pi);

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
  registerListQueueTool(pi, storage);
  registerListScopeTool(pi, storage);
  registerResolveConflictTool(pi, storage);

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

  tagProviderHeaders(pi);

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

    // Planning / scoping.
    registerScopeItemTool(pi, storage, coordinatorManager, domainManager);
    registerDelegateRequirementTool(pi, storage, domainManager);
    registerListScopeTool(pi, storage);
    registerResolveConflictTool(pi, storage);

    // Queue inspection.
    registerListQueueTool(pi, storage);

    // Agent lifecycle and messaging.
    registerStartAgentTool(pi, agentManager);
    registerStopAgentTool(pi, agentManager);
    registerLeaveNoteTool(pi, storage, serverManager);
    registerReadNoteTool(pi, storage);
    registerListAgentsTool(pi, storage, agentManager);
    registerPublishEventTool(pi, serverManager);
    registerListWebsocketClientsTool(pi, serverManager);

    ctx.ui.notify("Trellis loaded", "info");
  });

  // Route domain-manager completion notifications back to the coordinator.
  // Registered once outside session_start so duplicate listeners don't stack
  // if the session lifecycle fires multiple times.
  pi.events.on(TRELLIS_QUEUE_ITEM_COMPLETED, async (eventPayload: unknown) => {
    const payload = eventPayload as TrellisQueueItemCompletedEvent;
    await coordinatorManager!.onQueueItemCompleted(payload);
  });

  pi.events.on(TRELLIS_AGENT_CLOSED, (eventPayload: unknown) => {
    const payload = eventPayload as TrellisAgentClosedEvent;

    const agent = payload.agent;
    pi.sendMessage(
      {
        customType: TRELLIS_AGENT_CLOSED,
        content: `Closed ${agent.role} agent "${agent.name}" (${agent.id}, mode=${agent.mode}) for request ${agent.requestId} — exit code ${payload.exitCode}.`,
        display: true,
        details: {
          ...agent,
          exitCode: payload.exitCode,
          resultText: (payload.resultText || "").slice(0, 2000),
        },
      },
      { deliverAs: "followUp", triggerTurn: false },
    );
  });

  // Debug listeners: surface Trellis lifecycle events in the root transcript
  // so we can verify that spawned agents are publishing them reliably.
  pi.events.on(TRELLIS_AGENT_SPAWNED, (eventPayload: unknown) => {
    const payload = eventPayload as TrellisAgentSpawnedEvent;
    const agent = payload.agent;
    logTrellisEvent(pi, TRELLIS_AGENT_SPAWNED, payload, {
      content: `Spawned ${agent.role} agent "${agent.name}" (${agent.id}, mode=${agent.mode}) for request ${agent.requestId}.`,
    });
  });
  pi.events.on(TRELLIS_AGENT_SETTLED, (eventPayload: unknown) => {
    const payload = eventPayload as TrellisAgentSettledEvent;
    const agent = payload.agent;
    const resultPreview = payload.resultText
      ? ` Result: ${payload.resultText.slice(0, 160)}${payload.resultText.length > 160 ? "…" : ""}`
      : "";
    logTrellisEvent(pi, TRELLIS_AGENT_SETTLED, payload, {
      content: `Settled ${agent.role} agent "${agent.name}" (${agent.id}, mode=${agent.mode}).${resultPreview}`,
    });
  });
  pi.events.on(TRELLIS_COORDINATOR_STARTED, (eventPayload: unknown) => {
    logTrellisEvent(pi, TRELLIS_COORDINATOR_STARTED, eventPayload as TrellisCoordinatorStartedEvent);
  });
  pi.events.on(TRELLIS_COORDINATOR_UPDATED, (eventPayload: unknown) => {
    logTrellisEvent(pi, TRELLIS_COORDINATOR_UPDATED, eventPayload as TrellisCoordinatorUpdatedEvent);
  });
  // Surface queue completion events too, in addition to routing them to the coordinator manager.
  pi.events.on(TRELLIS_QUEUE_ITEM_COMPLETED, (eventPayload: unknown) => {
    logTrellisEvent(pi, TRELLIS_QUEUE_ITEM_COMPLETED, eventPayload as TrellisQueueItemCompletedEvent);
  });

  // Surface durable note traffic in the root transcript.
  pi.events.on(TRELLIS_NOTE_SENT, (eventPayload: unknown) => {
    const payload = eventPayload as TrellisNoteSentEvent;
    logTrellisEvent(pi, TRELLIS_NOTE_SENT, payload, {
      content: `Note sent from ${payload.fromAgentId} to ${payload.toAgentId} in request ${payload.requestId}.`,
    });
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
