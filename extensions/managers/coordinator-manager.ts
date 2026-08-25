/**
 * Trellis coordinator runtime.
 *
 * A deterministic, event-driven extension-runtime component that owns
 * coordinator lifecycle and session-level orchestration.
 *
 * Responsibilities:
 *   - Create root coordinator agents from `scoping-item` tool calls.
 *   - Rehydrate coordinator state from the storage adapter on `session_start`.
 *   - Surface work-item completion notifications from the notification manager
 *     to the right coordinator agent.
 *   - Gate final scope documents on human approval/rejection/abandonment.
 *
 * The coordinator runtime does not perform scope reasoning; it ferries context
 * and events between the user, the storage adapter, and coordinator agents.
 */

import type { StorageAdapter } from "~/extensions/storage/types.ts";

export interface CoordinatorManagerOptions {
  storage: StorageAdapter;
}

export class CoordinatorManager {
  readonly storage: StorageAdapter;

  constructor(options: CoordinatorManagerOptions) {
    this.storage = options.storage;
  }

  // TODO: start root/child coordinators via launcher.
  // TODO: handle trellis:notification_pending events.
  // TODO: assemble final scope document and open sign-off gate.
}
