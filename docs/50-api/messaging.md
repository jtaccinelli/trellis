# Messaging Tools

Minimal one-to-one messaging. Messages are notifications or steering notes, not an agent chat system.

## `sending-message`

```typescript
Type.Object({
  request_id: Type.String(),
  to: Type.String(), // recipient agent id
  payload: Type.String(), // JSON-encoded content
  in_reply_to: Type.Optional(Type.String()), // optional message id this replies to
});
```

- Creates a `Message` row from the caller to `to`.
- Intended for the user (root process) to steer a running coordinator or background agent.
- The extension notification manager also uses this internally with `from_agent_id: "domain-manager"` to push completion notices to coordinators.

## `receiving-message`

```typescript
Type.Object({
  request_id: Type.String(),
});
```

- Returns the **oldest unread message** addressed to the caller for the given request.
- Deletes that message from the table once it is read.
- Returns `remaining_count` so the caller knows whether more messages are queued.
- If `remaining_count > 0`, the caller can call `receiving-message` again to read the next message in FIFO order.

Result shape:

```typescript
{
  request_id: string;
  message?: {              // only present when a message is returned
    id: string;
    from_agent_id: string;
    to_agent_id: string;
    request_id: string;
    payload: unknown;      // parsed JSON payload
    in_reply_to?: string;
    created_at: number;
  };
  remaining_count: number;
}
```

> **Coordinators should not poll.** The notification manager pushes completion events; use this tool only when notified or when draining a batch.

## `publishing-event`

```typescript
Type.Object({
  topic: Type.String(),
  payload: Type.Object({}, { additionalProperties: true }),
  request_id: Type.Optional(Type.String()),
  target: Type.Optional(Type.String()),
  broadcast: Type.Optional(Type.Boolean()),
});
```

Publish a transient event to the Trellis WebSocket event bus. The event is emitted locally on `pi.events` and forwarded to connected peers:

- `request_id` — every agent registered for that request id receives it.
- `target` — only the named agent id receives it.
- `broadcast` — every connected agent except the publisher receives it.

Use this for status pings, progress updates, and other real-time signals that do not need to be durable. Final results should still use `sending-message` so they are persisted in SQLite.

## `listing-agents`

Read-only introspection tool from the shared registry.

## `listing-websocket-clients`

Read-only introspection tool showing agents currently connected to the WebSocket hub.

## See also

- [Messaging](../40-architecture/messaging.md)
- [Events](../40-architecture/events.md)
- [WebSocket server manager](../40-architecture/websocket-server-manager.md)
- [WebSocket client manager](../40-architecture/websocket-client-manager.md)
- [Domain management](../40-architecture/domain-manager.md)
