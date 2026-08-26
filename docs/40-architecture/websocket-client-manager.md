# WebSocket client manager

`WebSocketClientManager` runs in every non-root Trellis process (coordinators, domain agents, background agents). It connects to the root `WebSocketServerManager` and forwards events to it. Events received from the root are emitted locally on the process's `pi.events` bus.

## Role

- Connect to `TRELLIS_WS_URL` using `TRELLIS_WS_TOKEN`.
- Register the agent identity with the root server.
- Queue publishes before the connection is ready and flush them once connected.
- Reconnect automatically if the connection drops.

## Lifecycle

Agent-mode extensions create the client on load and open the connection during `session_start`:

```typescript
const clientManager = new WebSocketClientManager({
  pi,
  token: process.env.TRELLIS_WS_TOKEN,
});

clientManager.openConnection(process.env.TRELLIS_WS_URL!).catch(() => {
  // WS is best-effort.
});
```

The connection is performed in the background so a slow or unreachable server cannot block the agent's first turn.

## Receiving events

When the client receives an `event` message from the root it calls:

```typescript
pi.events.emit(topic, payload);
```

Agent-mode code can listen with `pi.events.on(topic, handler)`. The active model only sees the event when it is in a turn; unlike the message table, the WebSocket layer cannot wake a sleeping assistant by itself.

## Publishing events

Agents can call:

```typescript
clientManager.publish("trellis:my_event", payload, { requestId });
```

`publish` forwards the event to the root server's WebSocket connection. The server then routes it to interested peers by `target`, `requestId`, `broadcast`, or topic subscription. The `publishing-event` tool exposes the same capability to the model.

## Fallback

If the root server is unreachable, publishes accumulate in a short in-memory queue and reconnect is retried. If the agent exits before connecting, those transient events are lost. Durable outcomes should still be written to SQLite via `sending-message`.

## See also

- [WebSocket server manager](./websocket-server-manager.md)
- [Events](./events.md)
- [Messaging](./messaging.md)
