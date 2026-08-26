/**
 * Trellis domain manager.
 *
 * A deterministic, event-driven extension-runtime component that owns each
 * domain's shared FIFO queue and serializes domain-agent execution.
 *
 * Responsibilities:
 *   - Hold one FIFO queue per domain in the storage adapter.
 *   - When a coordinator enqueues a new item, pull the head and spawn a fresh
 *     domain agent if none is running for that domain.
 *   - On domain-agent exit, reap the result, mark the queue item done/failed,
 *     hand a notification to the notification manager, and start the next item.
 *   - Ensure at most one domain agent runs per domain at any moment.
 *
 * The domain manager does not perform scope reasoning and does not talk to
 * domain agents except through their work items.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import type { EventManager } from "~/extensions/managers/types.ts";
import type { QueueItem } from "~/extensions/storage/queue/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";
import { json } from "~/extensions/utils/index.ts";
import { TRELLIS_QUEUE_ITEM_COMPLETED } from "~/extensions/utils/events.ts";

export interface DomainManagerOptions {
  storage: StorageAdapter;
  agentManager: AgentManager;
  pi: ExtensionAPI;
  /**
   * Optional event manager used to push domain-agent completion events to
   * listening coordinators over the WebSocket event bus.
   */
  websocketManager?: EventManager;
  /**
   * Default bundled agent used to assess scope for any domain. Future work
   * may allow per-domain agent overrides.
   */
  domainAgentName?: string;
}

interface RunningMarker {
  agentId: string;
  queueItemId: string;
}

export class DomainManager {
  readonly storage: StorageAdapter;
  readonly agentManager: AgentManager;
  readonly pi: ExtensionAPI;
  readonly websocketManager?: EventManager;
  readonly domainAgentName: string;

  // domain_id -> running marker
  readonly running = new Map<string, RunningMarker>();

  constructor(options: DomainManagerOptions) {
    this.storage = options.storage;
    this.agentManager = options.agentManager;
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
    this.domainAgentName = options.domainAgentName ?? "domain-agent";
  }

  /**
   * Create a queue item for a requirement and begin processing if the domain is
   * idle. This is the single entry point for enqueueing work from coordinators.
   */
  async enqueue(
    requirement: { id: string; domain_id: string; request_id: string },
    coordinatorId: string,
    priority = 0,
  ): Promise<QueueItem> {
    const item: QueueItem = {
      id: `trellis:qi:${crypto.randomUUID()}`,
      domain_id: requirement.domain_id,
      requirement_id: requirement.id,
      enqueued_by_coordinator_id: coordinatorId,
      status: "queued",
      priority,
      created_at: Date.now(),
    };

    await this.storage.queue.create(item);

    if (!this.running.has(requirement.domain_id)) {
      await this.startNextAgent(requirement.domain_id);
    }

    return item;
  }

  /**
   * Called after a coordinator has enqueued a new queue item. If the domain is
   * idle, immediately start the next agent; otherwise the item waits in FIFO
   * order until the running agent exits.
   */
  async onItemEnqueued(_queueItem: QueueItem): Promise<void> {
    const domainId = _queueItem.domain_id;
    if (this.running.has(domainId)) return;
    await this.startNextAgent(domainId);
  }

  /**
   * Pull the next queued item for a domain and spawn a fresh domain agent for
   * it. No-op if the queue is empty or an agent is already running.
   */
  private async startNextAgent(domainId: string): Promise<void> {
    if (this.running.has(domainId)) return;

    const item = await this.storage.queue.peekNextByDomain(domainId, "queued");
    if (!item) return;

    const requirement = await this.storage.requirements.get(item.requirement_id);
    if (!requirement) {
      // Requirement missing: mark the queue item failed and move on.
      await this.failItem(item, "Requirement not found");
      await this.startNextAgent(domainId);
      return;
    }

    const agentId = `trellis:${crypto.randomUUID()}`;
    item.status = "running";
    item.domain_agent_id = agentId;
    await this.storage.queue.update(item);

    this.running.set(domainId, { agentId, queueItemId: item.id });

    // Build a concise task prompt for the domain agent.
    const task = [
      `Assess the following scope requirement for domain "${domainId}":`,
      "",
      requirement.description,
      "",
      "Return a structured assessment with these fields:",
      "- owned_scope: the part of the requirement this domain owns",
      "- contracts: array of { target_domain_id, description } for other domains",
      "- child_requirements: array of narrower requirement descriptions if needed",
      "- absorption_note: explain if this requirement is fully absorbed by an existing item",
      "- escalation_request: explain only if the requirement bounces between domains",
    ].join("\n");

    try {
      const handle = await this.agentManager.startAgentProcess({
        agentName: this.domainAgentName,
        role: "domain",
        task,
        requestId: item.requirement_id,
        agentId,
        domainId,
        queueItemId: item.id,
      });

      // Reap completion independently of whoever initiated the spawn.
      handle.promise
        .then(async (exitInfo) => {
          await this.onDomainAgentExit(domainId, handle.agentId, exitInfo);
        })
        .catch(async () => {
          await this.onDomainAgentExit(domainId, handle.agentId, {
            exitCode: 1,
            errorMessage: "Unhandled agent process error",
          });
        });
    } catch (error) {
      await this.onDomainAgentExit(domainId, agentId, {
        exitCode: 1,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async onDomainAgentExit(
    domainId: string,
    agentId: string,
    exitInfo: { exitCode: number; errorMessage?: string; resultText?: string; usage?: unknown },
  ): Promise<void> {
    const marker = this.running.get(domainId);
    if (!marker || marker.agentId !== agentId) {
      // Stale exit event; ignore.
      return;
    }

    const item = await this.storage.queue.get(marker.queueItemId);
    this.running.delete(domainId);

    if (!item) return;

    const failed = exitInfo.exitCode !== 0;
    item.status = failed ? "failed" : "done";
    item.result_payload = json({
      exitCode: exitInfo.exitCode,
      errorMessage: exitInfo.errorMessage,
      resultText: exitInfo.resultText,
      usage: exitInfo.usage,
    });
    await this.storage.queue.update(item);

    await this.notifyQueueItemComplete(item, failed);

    // Drain the next item if any.
    await this.startNextAgent(domainId);
  }

  private async failItem(item: QueueItem, reason: string): Promise<void> {
    item.status = "failed";
    item.result_payload = json({ error: reason });
    await this.storage.queue.update(item);
    await this.notifyQueueItemComplete(item, true);
  }

  private async notifyQueueItemComplete(item: QueueItem, failed: boolean): Promise<void> {
    const requirement = await this.storage.requirements.get(item.requirement_id);
    const requestId = requirement?.request_id ?? "unknown";

    const eventPayload = {
      requestId,
      queueItemId: item.id,
      coordinatorId: item.enqueued_by_coordinator_id,
      failed,
    };

    this.pi.events.emit(TRELLIS_QUEUE_ITEM_COMPLETED, eventPayload);
    this.websocketManager?.publish(TRELLIS_QUEUE_ITEM_COMPLETED, eventPayload, { requestId });
  }
}
