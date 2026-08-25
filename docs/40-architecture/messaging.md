# Messaging

Trellis keeps a minimal one-to-one message table in the storage adapter. Messages are used for two things:

1. **Extension runtime notifications** — the notification manager tells a coordinator that one of its work items completed (`from_agent_id: "queue-manager"`).
2. **User steering notes** — the user, from the main Pi process, can send a short note to a running agent.

Agents do not message each other. Domain agents return their results through the work item they were spawned for; coordinators receive completion notices through the notification manager.

## Model

```typescript
interface Message {
  id: string;
  from_agent_id: string; // "queue-manager", "user", or an agent id
  to_agent_id: string;    // recipient agent id
  payload: string;
  in_reply_to?: string;
  created_at: number;
}
```

The `messages` table is the source of truth. Per-agent `inbox.ndjson` files are optional local caches, not canonical.

## Who can send

- **Root extension / user tool call**: `sending-message` is surfaced to the user so they can steer a running agent.
- **Extension notification manager**: writes completion notices automatically when a domain agent exits.

Subagents generally do not call `sending-message`. Their output belongs in the work item or `result.json`.

## Delivery

- Append the row to the storage adapter.
- The notification manager dispatches a `trellis:notification_pending` event from the main thread.
- The event handler triggers `sending-message` (or an equivalent delivery call) to the target coordinator.
- The coordinator may then call `receiving-message` to read pending notifications.

> **Coordinators do not poll.** A coordinator waits for the notification manager to surface completion before reading messages.
>
> **Steering is not real-time.** A user message sent to a running child agent is only seen when that agent next calls `receiving-message`. The parent cannot interrupt an in-flight model turn.

## Notification manager

The notification manager is a runtime component, separate from the queue manager, with two responsibilities:

1. **On domain-agent exit**, ensure a completion message is enqueued for the originating coordinator.
2. **Dispatch** a `trellis:notification_pending` event so the extension can deliver the message to the coordinator agent without requiring the coordinator to poll.

It does not manage queues or spawn agents. It only bridges work-item completion to coordinator notification.

## Tools

- `sending-message` — user or extension runtime sends a one-to-one message.
- `receiving-message` — recipient reads its own inbox, typically after being notified.

## See also

- [API: messaging tools](../50-api/messaging.md)
- [Queue management](./queue-manager.md)
- [Events](./events.md)
- [Lineage and spawn](./lineage-and-spawn.md)
