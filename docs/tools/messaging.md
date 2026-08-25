# Messaging & Steering Tools

Trellis uses minimal one-to-one messaging. Messages are notifications or steering notes, not a chat system. Agents do not message each other directly; domain agents return results through their work item.

## `sending-message`

Send a one-to-one message to a running agent.

### Purpose

Allow the user (root process) or the extension runtime to direct a running coordinator or background agent. The most common extension-runtime sender is the **notification manager** (`from_agent_id: "queue-manager"`) pushing completion notices to coordinators.

### Who calls it

- The **user**, to steer a running coordinator or background agent.
- The **extension notification manager**, automatically, when a domain agent completes.

### Schema

```typescript
Type.Object({
  to: Type.String(), // recipient agent id
  content: Type.String(),
  inReplyTo: Type.Optional(Type.String()),
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `to` | yes | Recipient agent id. |
| `content` | yes | Plain-text payload. |
| `inReplyTo` | no | Id of a previous message this replies to. |

### Result

Returns a delivery receipt with the new message id.

```typescript
{
  content: [{ type: "text", text: "Message sent to <to>" }],
  details: { message_id: string }
}
```

### Important note

Steering is **not real-time**. A running child agent only sees the message when it next calls `receiving-message`.

---

## `receiving-message`

Poll the caller's own inbox.

### Purpose

Read pushed messages from the caller's inbox. Coordinators use this after the notification manager alerts them that a domain agent completed. Background workers use it for user steering notes.

### Who calls it

Any running agent that needs to read messages addressed to it. Coordinators should call it only when notified, not in a polling loop.

### Schema

```typescript
Type.Object({
  from: Type.Optional(Type.String()),       // filter by sender id
  maxMessages: Type.Optional(Type.Number()), // default 10
  waitMs: Type.Optional(Type.Number()),     // 0 = immediate poll
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `from` | no | Only return messages from this sender. |
| `maxMessages` | no | Maximum messages to return; default 10. |
| `waitMs` | no | How long to wait for new messages; 0 means immediate poll. |

### Result

Returns unread messages for the caller, ordered by timestamp.

```typescript
{
  content: [{ type: "text", text: "<n> messages" }],
  details: {
    messages: Array<{
      id: string;
      from_agent_id: string;
      to_agent_id: string;
      payload: string;
      in_reply_to?: string;
      created_at: number;
    }>
  }
}
```

---

## `listing-agents`

List known agents in the session lineage.

### Purpose

Read-only introspection from the shared agent registry. Useful for finding an agent id before sending a message or checking the session tree.

### Who calls it

User or long-lived agents.

### Schema

No parameters.

### Result

Returns the list of agents with ids, roles, parents, and states.

```typescript
{
  content: [{ type: "text", text: "<n> agents" }],
  details: {
    agents: Array<{
      id: string;
      name: string;
      role: "coordinator" | "domain" | "background";
      parent_id?: string;
      status: "running" | "done" | "failed";
    }>
  }
}
```

### See also

- [Messaging architecture](../40-architecture/messaging.md)
- [Queue manager](../40-architecture/queue-manager.md)
- [API reference: messaging tools](../50-api/messaging.md)
