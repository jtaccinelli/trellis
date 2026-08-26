# Event-driven runtime

Trellis uses Pi’s in-process event bus (`pi.events`) to decouple agent lifecycle from consumers such as the coordinator runtime and UI. Events are emitted by extension-runtime components and consumed by other parts of the same root extension. They do **not** cross into child `pi` processes.

## Pi event bus

```typescript
pi.events.on("trellis:agent_closed", (data) => { ... });
pi.events.emit("trellis:agent_closed", { agentId, ... });
```

`pi.events` is local to a single Pi process. Trellis also has a cross-process event layer in `WebSocketManager`; when an event is published over that layer it is delivered to remote agents and also emitted locally on `pi.events`. This means root listeners can continue to use `pi.events.on(...)` while agents in other processes receive the same events over the WebSocket.

## Why use events inside Trellis?

- Decouple agent lifecycle, the domain manager, the coordinator runtime, and UI updates.
- Allow multiple subsystems to react to the same state change without the emitter knowing about them.
- Feed subagent completion back into the main context automatically via `pi.sendMessage`.

Events are not a replacement for cross-agent messages or durable storage. They signal that something happened; the storage adapter remains the source of truth.

## Event vocabulary

| Event | Emitter | Consumers | Purpose |
|---|---|---|---|
| `trellis:agent_spawned` | `AgentManager` when a child process starts | Root, agents on same request | A new agent joined the runtime |
| `trellis:agent_closed` | `AgentManager` when any child process exits | Root extension, UI, agents on same request | A spawned coordinator, domain, or background agent finished |
| `trellis:queue_item_completed` | `NotificationManager` after a domain agent finishes a queue item | `CoordinatorManager` | A delegated requirement has been assessed and the result is in storage |
| `trellis:coordinator_started` | `CoordinatorManager` when a root request is created | Root, agents on same request | A new scoping request has begun |

## `trellis:agent_closed`

Fired by `AgentManager` for every spawned agent, regardless of role or exit reason.

Payload shape:

```typescript
{
  agentId: string;
  agentName: string;
  role: "coordinator" | "domain" | "background";
  requestId: string;
  exitCode: number;
  stopReason?: string;
  errorMessage?: string;
  resultText?: string;
  usage?: AgentUsageStats;
}
```

The root extension listens for this event and injects a custom message into the main context so the assistant knows to check for subagent output:

```typescript
pi.events.on("trellis:agent_closed", (eventPayload) => {
  const payload = eventPayload as TrellisAgentClosedPayload;
  pi.sendMessage(
    {
      customType: "trellis:agent_closed",
      content: `Trellis agent "${payload.agentName}" (${payload.role}) closed. Use the receiving-message tool to check for messages addressed to you.`,
      display: true,
      details: payload,
    },
    { deliverAs: "followUp", triggerTurn: true },
  );
});
```

This avoids polluting the user input transcript while still prompting the main assistant to retrieve results.

## `trellis:queue_item_completed`

Fired by the notification manager after the domain manager reaps a domain agent’s result. It carries enough information for `CoordinatorManager` to reload the queue item and continue the recursive scoping loop.

Payload shape:

```typescript
{
  requestId: string;
  queueItemId: string;
  coordinatorId: string;
  failed: boolean;
}
```

## Child-agent boundary

`pi.events` stops at the process boundary. A child agent cannot call `pi.events.emit()` back to the parent because it runs in a separate `pi --mode json` process. `WebSocketServerManager` / `WebSocketClientManager` bridge this gap: any Trellis process can `publish()` an event, and every connected peer receives it. See the [WebSocket server manager](./websocket-server-manager.md) and [WebSocket client manager](./websocket-client-manager.md) docs for protocol details.

Child completion is detected by the parent:

1. The domain manager or `starting-agent` tool spawns a child process.
2. The child writes results via `sending-message` or exits with output.
3. The parent’s child-process `close` handler fires.
4. `AgentManager` emits `trellis:agent_closed`.
5. Consumers either push a prompt into the main context or update the coordinator runtime.

## Relationship to other docs

- [Agent management](../40-architecture/agent-management.md) — how `AgentManager` spawns and tracks child processes.
- [WebSocket server manager](../40-architecture/websocket-server-manager.md) — root hub that routes events between agents.
- [WebSocket client manager](../40-architecture/websocket-client-manager.md) — agent-side connection to the hub.
- [Domain management](../40-architecture/domain-manager.md) — how the domain manager consumes the queue and reaps results.
- [Messaging](../40-architecture/messaging.md) — one-to-one messages and notifications for child agents.
- [Coordinator runtime](../40-architecture/coordinator-runtime.md) — consumer of completed work items.
