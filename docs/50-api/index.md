# API Reference

This section defines the formal JSON schemas for the custom tools registered by Trellis. For practical, user-oriented guidance on what each tool does and how to call it, see [`docs/tools/`](../tools/). Internal coordination (e.g., spawning coordinators and domain agents, enqueueing work items) is driven by the runtime and documented in [Architecture](../40-architecture/).

## Tool index

All Trellis tools use gerund-noun naming (`scoping-item`, `delegating-requirement`, etc.) and are registered without a `trellis_` prefix. The extension itself provides the namespace.

| Tool | Purpose | Mode |
|------|---------|------|
| [scoping-item](./scoping-item.md) | Start a recursive domain-scoped scoping session | Foreground, streaming |
| [delegating-requirement](./delegating-requirement.md) | Coordinator tool to enqueue a requirement on a shared domain queue | Internal |
| [spawning-agent](./spawning-agent.md) | Recursive background subagent spawn | Background, returns receipt |
| [messaging](./messaging.md) | `sending-message`, `receiving-message`, `listing-agents` | Root + agent |
| [domains](./domains.md) | `creating-domain`, `listing-domains` | Direct |
| [inspection](./inspection.md) | `inspecting-scope`, `inspecting-queue`, `resolving-conflict` | Direct |
| [cataloguing](./cataloguing.md) | `querying-items`, `upserting-item`, `linking-requirement`, `resolving-item-conflict` | Internal |

Internal runtime behavior:

- [Delegation model](../40-architecture/delegation.md) — how coordinators and domain agents are matched.
- [Coordinator runtime](../40-architecture/coordinator-runtime.md) — scoping lifecycle and queue orchestration.

## Conventions

- All params use `typebox`.
- String enums use `StringEnum` from `@earendil-works/pi-ai`.
- Errors are signaled by throwing from `execute`.
- Results return `content` (model-visible) and `details` (TUI/state).
