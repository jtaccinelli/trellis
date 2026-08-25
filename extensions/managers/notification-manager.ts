/**
 * Trellis notification manager.
 *
 * A deterministic, event-driven extension-runtime component that bridges
 * domain-agent completion to coordinator notification.
 *
 * Responsibilities:
 *   - Listen for `trellis:work_item_completed` events from the queue manager.
 *   - Insert a completion message into the storage adapter for the originating
 *     coordinator (`from_agent_id: "queue-manager"`).
 *   - Emit `trellis:notification_pending` on the main-thread event bus.
 *   - Let the message delivery handler push the notice to the coordinator agent
 *     without requiring the coordinator to poll.
 *
 * The notification manager does not spawn agents or manage queues.
 */

import type { StorageAdapter } from "~/extensions/storage/types.ts";

export interface NotificationManagerOptions {
  storage: StorageAdapter;
}

export class NotificationManager {
  readonly storage: StorageAdapter;

  constructor(options: NotificationManagerOptions) {
    this.storage = options.storage;
  }

  // TODO: subscribe to pi.events, write messages via storage adapter,
  // and dispatch trellis:notification_pending events.
}
