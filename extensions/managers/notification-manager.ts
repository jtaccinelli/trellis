/**
 * Trellis notification manager.
 *
 * Bridges domain-agent completion to coordinator notification. It writes a
 * lightweight message into durable storage and emits a main-thread event so
 * the coordinator (or extension runtime) can react without polling.
 */

import { randomUUID } from "node:crypto";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { QueueItem } from "~/extensions/storage/queue/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";
import type { EventPublisher } from "~/extensions/managers/types.ts";
import { json } from "~/extensions/utils/index.ts";

export interface NotificationManagerOptions {
  storage: StorageAdapter;
  pi: ExtensionAPI;
  websocketManager?: EventPublisher;
}

export class NotificationManager {
  readonly storage: StorageAdapter;
  readonly pi: ExtensionAPI;
  readonly websocketManager?: EventPublisher;

  constructor(options: NotificationManagerOptions) {
    this.storage = options.storage;
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
  }

  /**
   * Called by the domain manager when a queue item finishes (done or failed).
   * Inserts a Message row for the originating coordinator and emits an event on
   * the extension event bus.
   */
  async notifyQueueItemComplete(item: QueueItem, failed: boolean): Promise<void> {
    const requirement = await this.storage.requirements.get(item.requirement_id);
    const requestId = requirement?.request_id ?? "unknown";

    const message = {
      id: `trellis:msg:${randomUUID()}`,
      request_id: requestId,
      from_agent_id: "trellis:domain-manager",
      to_agent_id: item.enqueued_by_coordinator_id,
      payload: json({
        type: "queue_item_completed",
        queue_item_id: item.id,
        domain_id: item.domain_id,
        requirement_id: item.requirement_id,
        status: item.status,
        failed,
      }),
      created_at: Date.now(),
    };

    await this.storage.messages.create(message);

    const eventPayload = {
      requestId,
      queueItemId: item.id,
      coordinatorId: item.enqueued_by_coordinator_id,
      failed,
    };

    this.pi.events.emit("trellis:queue_item_completed", eventPayload);
    this.websocketManager?.publish("trellis:queue_item_completed", eventPayload, { requestId });
  }
}
