# WebSocket server manager

`WebSocketServerManager` runs only in the root pi process. It hosts the local WebSocket hub that all spawned Trellis agents connect to, and it routes published events between connected clients.

## Role

- Start a `WebSocketServer` on `127.0.0.1` with an OS-assigned port.
- Authenticate registering agents with a shared token.
- Maintain a registry of connected agents keyed by agent id.
- Route events by `target`, `requestId`, `broadcast`, or subscription.

## Lifecycle

The root extension creates the manager during `session_start`:

```typescript
const serverManager = new WebSocketServerManager({ pi });
const wsUrl = await serverManager.startServer();
process.env.TRELLIS_WS_URL = wsUrl;
process.env.TRELLIS_WS_TOKEN = serverManager.token;
```

Child agents inherit the URL and token through environment variables.

## Registration protocol

A client must send a `register` message immediately after connecting:

```json
{
  "type": "register",
  "agentId": "trellis:...",
  "role": "domain",
  "name": "domain-agent",
  "requestId": "trellis:req:...",
  "parentId": "trellis:...",
  "token": "..."
}
```

If the token is invalid the connection is closed. If another socket is already registered for the same `agentId`, the old socket is closed.

## Event routing

When a `publish` message arrives, the server emits it locally on `pi.events` and forwards it according to the routing hints:

| Hint | Behaviour |
|---|---|
| `broadcast: true` | Every connected agent except the sender |
| `target` | Only the named agent id |
| `requestId` | Every agent registered for that request id |
| none | Agents that have subscribed to the topic |

## Events published from the root

- `trellis:agent_spawned` — `AgentManager`
- `trellis:agent_closed` — `AgentManager`
- `trellis:queue_item_completed` — `NotificationManager`
- `trellis:coordinator_started` — `CoordinatorManager`

These events are still emitted separately via `pi.events.emit()` so root listeners continue to work.

## Tools

- `listing-websocket-clients` returns the ids currently connected to the server.
- `publishing-event` can publish events from the root, which the server routes to clients.

## See also

- [WebSocket client manager](./websocket-client-manager.md)
- [Events](./events.md)
- [Messaging](./messaging.md)
