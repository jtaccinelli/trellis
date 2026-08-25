# Event-driven runtime (draft)

> Draft. This page sketches a possible event-driven formalization of the Trellis extension runtime. It is not yet the canonical implementation path.

Trellis currently describes the queue manager and coordinator runtime as direct function calls. Pi exposes `pi.events`, an in-process event bus that lets extensions formalize these actions as events. This page sketches how that could look.

## Pi event bus

Pi extensions can emit and listen to arbitrary string events:

```typescript
pi.events.on("trellis:work_item_completed", (data) => { ... });
pi.events.emit("trellis:work_item_completed", { workItemId, status });
```

These events are local to the root Pi process. They do **not** cross into child `pi` subagents.

## Why use events inside Trellis?

- Decouple queue manager, coordinator runtime, and UI.
- Make state transitions explicit and auditable.
- Let multiple extension subsystems react to the same fact without the emitter knowing about them.

Events are not a replacement for cross-agent messages or the storage adapter. Child subagents still discover results by reading `WorkItem` rows or `receiving-message`, but they do so after being notified by the extension runtime, not by polling.

## Proposed event vocabulary

| Event | Emitter | Consumers | Purpose |
|---|---|---|---|
| `trellis:session_loaded` | Extension `session_start` handler | Queue manager, notification manager, UI | Rehydrate in-memory state |
| `trellis:work_item_enqueued` | `delegating-requirement` tool | Queue manager | Domain queue changed |
| `trellis:domain_agent_spawned` | Queue manager | Agent registry, UI | Track running children |
| `trellis:domain_agent_exited` | Queue manager on child exit | Exit handler | Reap result / retry |
| `trellis:work_item_completed` | Exit handler | Notification manager | Result ready |
| `trellis:notification_pending` | Notification manager | Message delivery handler, UI | Coordinator notice ready |
| `trellis:message_delivered` | Message delivery handler | UI | Coordinator has been notified |
| `trellis:coordinator_state_changed` | Coordinator runtime | UI | Scope tree / final scope updated |

## Example flow

```
User: "scope this feature"
    │
    ▼
scoping-item tool
    │
    ▼
session + requirements created
    │
    ▼
emit trellis:work_item_enqueued { domain_id, requirement_id, work_item_id }
    │
    ▼
Queue manager listener
    │ spawns domain agent
    ▼
Domain agent exits
    │
    ▼
emit trellis:domain_agent_exited { work_item_id, exitCode }
    │
    ▼
Completion handler
    ├─ update WorkItem.status
    ├─ update WorkItem.result_payload
    └─ emit trellis:work_item_completed { work_item_id, status }
         │
         ▼
    Notification manager
    │   insert Message to coordinator inbox
    │   emit trellis:notification_pending { to_agent_id, message_id }
    ▼
    Message delivery handler
    │   call sending-message to push notice to coordinator agent
    ▼
    emit trellis:message_delivered { to_agent_id, message_id }
```

## Notification manager

The notification manager is an extension-runtime component that converts work-item completion into coordinator notification. It is separate from the queue manager because:

- The queue manager should not know how coordinators are notified.
- Multiple coordinators may be notified for the same event.
- Notification delivery can be retried independently of queue state.

When `trellis:work_item_completed` fires, the notification manager:

1. Inserts a `Message` row for the originating coordinator.
2. Emits `trellis:notification_pending` (main thread event).
3. Lets the message delivery handler push the notice to the coordinator agent (e.g., via `sending-message`).

## Child-agent boundary

Events stop at the process boundary. A child agent cannot call `pi.events.emit()` back to the parent because it runs in a separate `pi --mode json` process.

Child completion is detected by the parent, not reported by the child:

- The queue manager spawns the child and holds its process handle.
- The child writes `result.json` and exits.
- The parent’s child-process `exit` handler fires.
- The queue manager reads `result.json` and emits `trellis:work_item_completed`.
- The notification manager inserts a message and emits `trellis:notification_pending`.

Mapping from internal events to child-agent delivery:

```typescript
pi.events.on("trellis:notification_pending", ({ messageId }) => {
  const message = storageAdapter.getMessage(messageId);
  sendMessageToCoordinator(message);
});
```

## Open questions

- Should the queue manager be a single event handler or a state machine with explicit states per domain?
- Do we need durable event logs, or is the storage adapter state enough?
- How do we correlate events after `/reload` or session restore?
- Should user steering messages also emit events (e.g., `trellis:steering_message_sent`) for UI updates?

## Relationship to other docs

- [Queue management](./queue-manager.md) — current direct-call description.
- [Messaging](./messaging.md) — one-to-one messages and notifications for child agents.
- [Coordinator runtime](./coordinator-runtime.md) — consumer of completed work items.
