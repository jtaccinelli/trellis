# Architecture

Trellis is built as a Pi extension that layers coordination on top of Pi's native subagent primitive.

## Subsystems

| Document | Concern | Pi primitive(s) |
|----------|---------|-----------------|
| [Pi primitives](./pi-primitives.md) | Mapping between Trellis and Pi concepts | All of them |
| [Launcher](./launcher.md) | Spawning coordinator-agent and domain-agent child `pi` processes | `spawn`, `--mode json`, `ctx.signal` |
| [Agent management](./agent-management.md) | Bundled agent catalog and lifecycle of all spawned child `pi` processes | `spawn`, `pi.events` |
| [Delegation model](./delegation.md) | Coordinator agents, domain agents, shared domain queues, and the extension domain manager | `pi.registerTool`, storage adapter |
| [Domain management](./domain-manager.md) | Extension-runtime component that owns each domain queue and serializes domain-agent execution | `spawn`, `registerTool`, storage adapter |
| [Items](./items.md) | Durable domain leaves: contract, build lifecycle, reuse graph | Storage adapter, filesystem overlay |
| [Coordinator runtime](./coordinator-runtime.md) | Scoping lifecycle, queue loop, escalation | `registerTool`, `onUpdate`, `pi.sendMessage` |
| [Communication pathways](./communication-pathways.md) | Message and state flows between all subagents, including recursive loops | All of the above |
| [Messaging](./messaging.md) | One-to-one steering notes and runtime notifications | `registerTool` (root + agent), storage adapter |
| [Events](./events.md) | In-process event bus used for agent lifecycle and completion notifications | `pi.events` (in-process) |
| [WebSocket server manager](./websocket-server-manager.md) | Root WebSocket hub that routes events between agents | `WebSocketServer` |
| [WebSocket client manager](./websocket-client-manager.md) | Agent-side client that connects to the root hub and forwards events | `WebSocket` |
| [Lineage and spawn](./lineage-and-spawn.md) | Recursive child-agent spawning and the agent tree | `registerTool` (ambient), filesystem state |
| [Storage adapter](./storage-adapter.md) | Persistent structured data | `pi.appendEntry`, `ctx.sessionManager` for summaries |
| [Rendering](./rendering.md) | TUI representation | `renderCall`/`renderResult`, `ctx.ui.setWidget`, `ctx.ui.custom()` |

## Root vs agent mode

The extension factory checks `process.env.TRELLIS_AGENT_ID` and `process.env.TRELLIS_ROLE`:

- **Root mode:** register tools, commands, lifecycle hooks, TUI widgets, and the domain manager.
- **Coordinator-agent mode:** register only the tools a coordinator agent uses to enqueue work and inspect state.
- **Domain-agent mode:** register only the ambient messaging/spawn tools so a child agent can talk back or spawn further children.
