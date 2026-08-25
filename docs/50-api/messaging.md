# Messaging Tools

Minimal one-to-one messaging. Messages are notifications or steering notes, not an agent chat system.

## `sending-message`

```typescript
Type.Object({
  to: Type.String(), // recipient agent id
  content: Type.String(),
  inReplyTo: Type.Optional(Type.String()),
});
```

- Creates a `Message` row from the caller to `to`.
- Intended for the user (root process) to steer a running coordinator or background agent.
- The extension notification manager also uses this internally with `from_agent_id: "queue-manager"` to push completion notices to coordinators.

## `receiving-message`

```typescript
Type.Object({
  from: Type.Optional(Type.String()), // filter by sender id
  maxMessages: Type.Optional(Type.Number()), // default 10
  waitMs: Type.Optional(Type.Number()),     // 0 = immediate poll
});
```

- Reads messages where `to_agent_id` equals the caller.
- Returns unread rows ordered by timestamp.
- **Coordinators should not poll.** The notification manager pushes completion events; use this tool only when notified or when draining a batch.

## `listing-agents`

Read-only introspection tool from the shared registry.

## See also

- [Messaging](../40-architecture/messaging.md)
- [Queue management](../40-architecture/queue-manager.md)
