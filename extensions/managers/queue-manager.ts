/**
 * Trellis queue manager.
 *
 * A deterministic, event-driven extension-runtime component that owns each
 * domain's shared FIFO queue and serializes domain-agent execution.
 *
 * Responsibilities:
 *   - Hold one FIFO queue per domain in the storage adapter.
 *   - On `trellis:work_item_enqueued`, pull the head item and spawn a fresh
 *     domain agent if none is running for that domain.
 *   - On domain-agent exit, reap the result, mark the work item done/failed,
 *     hand notification to the notification manager, and start the next item.
 *   - Ensure at most one domain agent runs per domain at any moment.
 *
 * The queue manager does not perform scope reasoning and does not talk to
 * domain agents except through their work items.
 */

import type { StorageAdapter } from "~/extensions/storage/types.ts";

export interface QueueManagerOptions {
  storage: StorageAdapter;
}

export class QueueManager {
  readonly storage: StorageAdapter;

  // domain_id -> running domain_agent_id | null
  readonly running = new Map<string, string | null>();

  constructor(options: QueueManagerOptions) {
    this.storage = options.storage;
  }

  // TODO: subscribe to trellis:work_item_enqueued events.
  // TODO: spawn domain agents via launcher on head item.
  // TODO: register child-exit handlers to reap results and drain queues.
  // TODO: access domains through storage.domains.*
}
