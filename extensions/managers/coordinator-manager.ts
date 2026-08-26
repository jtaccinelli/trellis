/**
 * Trellis coordinator runtime.
 *
 * A deterministic, event-driven extension-runtime component that owns
 * coordinator lifecycle and request-level orchestration.
 *
 * Responsibilities:
 *   - Create root coordinators from `scope-item` tool calls.
 *   - Rehydrate coordinator state from the storage adapter on session start.
 *   - Surface work-item completion notifications from the notification manager
 *     to the right coordinator agent.
 *   - Gate final scope documents on human approval/rejection/abandonment.
 *
 * The coordinator runtime does not perform scope reasoning; it ferries context
 * and events between the user, the storage adapter, and coordinator agents.
 */

import { randomUUID } from "node:crypto";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import type { DomainManager } from "~/extensions/managers/domain-manager.ts";
import type { ScopeRequest } from "~/extensions/storage/requests/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";
import type { EventManager } from "~/extensions/managers/types.ts";
import {
  TRELLIS_COORDINATOR_STARTED,
  TRELLIS_COORDINATOR_UPDATED,
  type TrellisCoordinatorStartedEvent,
  type TrellisCoordinatorUpdatedEvent,
} from "~/extensions/utils/events.ts";

export interface CoordinatorManagerOptions {
  storage: StorageAdapter;
  agentManager: AgentManager;
  domainManager: DomainManager;
  pi: ExtensionAPI;
  websocketManager?: EventManager;
}

interface CoordinatorState {
  requestId: string;
  coordinatorId: string;
}

export class CoordinatorManager {
  readonly storage: StorageAdapter;
  readonly agentManager: AgentManager;
  readonly domainManager: DomainManager;
  readonly pi: ExtensionAPI;
  readonly websocketManager?: EventManager;

  readonly coordinators = new Map<string, CoordinatorState>();

  constructor(options: CoordinatorManagerOptions) {
    this.storage = options.storage;
    this.agentManager = options.agentManager;
    this.domainManager = options.domainManager;
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
  }

  /**
   * Start a root, in-process coordinator for a new user request.
   *
   * This creates the request record, seeds an initial requirement, and enqueues
   * it on the target domain's queue. Future iterations will run the recursive
   * scoping loop, process domain-agent assessments, and detect oscillation.
   */
  async startRootCoordinator(description: string, targetDomainId: string): Promise<ScopeRequest> {
    const coordinatorId = `trellis:root:${randomUUID()}`;
    const requestId = `trellis:req:${randomUUID()}`;

    const request: ScopeRequest = {
      request_id: requestId,
      description,
      status: "scoping",
      coordinator_id: coordinatorId,
    };

    await this.storage.requests.create(request);

    const requirement = {
      id: `trellis:req-item:${randomUUID()}`,
      request_id: requestId,
      description,
      domain_id: targetDomainId,
      parent_requirement_id: undefined,
      status: "assigned" as const,
      owned_scope: undefined,
      contracts: [],
      child_requirement_ids: [],
      reassignment_count: 0,
      created_at: Date.now(),
    };

    await this.storage.requirements.create(requirement);

    this.coordinators.set(requestId, { requestId, coordinatorId });

    await this.domainManager.enqueue(requirement, coordinatorId);

    const eventPayload: TrellisCoordinatorStartedEvent = { requestId, coordinatorId };
    this.pi.events.emit(TRELLIS_COORDINATOR_STARTED, eventPayload);
    this.websocketManager?.publish(TRELLIS_COORDINATOR_STARTED, eventPayload, { requestId });

    return request;
  }

  /**
   * Resume a request from storage. Called during session_start for any
   * in-flight request.
   */
  async rehydrateRequest(requestId: string): Promise<void> {
    const request = await this.storage.requests.get(requestId);
    if (!request) return;

    this.coordinators.set(requestId, {
      requestId,
      coordinatorId: request.coordinator_id,
    });
  }

  /**
   * React when a queue item owned by one of our coordinators completes. The
   * actual result is read from storage; this handler simply routes the event.
   */
  async onQueueItemCompleted(event: {
    requestId: string;
    queueItemId: string;
    coordinatorId: string;
    failed: boolean;
  }): Promise<void> {
    const state = this.coordinators.get(event.requestId);
    if (!state) return;

    if (state.coordinatorId !== event.coordinatorId) return;

    // TODO: read the queue item result, update the requirement, create child
    // requirements or contracts, and enqueue new work until the queue is stable.
    const updatedPayload: TrellisCoordinatorUpdatedEvent = {
      requestId: event.requestId,
      queueItemId: event.queueItemId,
      failed: event.failed,
    };
    this.pi.events.emit(TRELLIS_COORDINATOR_UPDATED, updatedPayload);
  }
}
