# Trellis Extension Tools

This section is the user-facing guide to every custom tool registered by the Trellis extension. For the formal JSON-schema API reference, see [`docs/50-api/`](../50-api/).

## Naming convention

All Trellis tools use **gerund-noun** pairing and are registered without a `trellis_` prefix:

- `scoping-item`
- `delegating-requirement`
- `spawning-agent`
- `sending-message`, `receiving-message`, `listing-agents`
- `creating-domain`, `getting-domain`, `updating-domain`, `deleting-domain`, `listing-domains`
- `inspecting-scope`, `inspecting-queue`, `resolving-conflict`

The extension provides the namespace; repeating `trellis_` on every tool adds noise without disambiguation.

## What these tools do

Trellis exposes tools that map to four user-initiated processes. Every tool is either called by the user directly, by a running coordinator agent, or automatically by the extension runtime.

| Process | Tools | Who calls them |
|---------|-------|----------------|
| **Planning / Scoping** | `scoping-item`, `delegating-requirement` | User starts `scoping-item`; coordinator agents call `delegating-requirement` |
| **Implementing** | `spawning-agent` | Coordinator agents, root process, or other long-lived agents |
| **Reviewing / Steering** | `sending-message`, `receiving-message`, `resolving-conflict` | User steers running agents; coordinators read pushed completion notices |
| **Deploying** | *(planned)* merge-gate tools | *(not yet defined)* |
| **Cataloguing** | `querying-items`, `upserting-item`, `linking-requirement`, `resolving-item-conflict` | Coordinator/domain agents |
| **Housekeeping** | `creating-domain`, `listing-domains`, `listing-agents` | User or project setup script |
| **Inspection** | `inspecting-scope`, `inspecting-queue` | User or long-lived agents |

## Tool catalog

### Scoping
- [`scoping-item`](./scoping.md#scoping-item) — start a recursive, domain-scoped planning session and gate the final scope on human approval.
- [`delegating-requirement`](./scoping.md#delegating-requirement) — internal coordinator tool that enqueues a scope requirement on a domain's shared work queue.

### Background work
- [`spawning-agent`](./spawn.md#spawning-agent) — spawn a background subagent from inside another agent.

### Messaging & steering
- [`sending-message`](./messaging.md#sending-message) — send a one-to-one note to a running agent or to a coordinator.
- [`receiving-message`](./messaging.md#receiving-message) — read pushed messages from the caller's inbox.
- [`listing-agents`](./messaging.md#listing-agents) — list known agents in the session lineage.

### Domain management
- [`creating-domain`](./domains.md#creating-domain) — add a project domain.
- [`getting-domain`](./domains.md#getting-domain) — read one domain.
- [`updating-domain`](./domains.md#updating-domain) — overwrite an existing domain.
- [`deleting-domain`](./domains.md#deleting-domain) — remove a domain.
- [`listing-domains`](./domains.md#listing-domains) — list configured domains.

### Inspection & conflict resolution
- [`inspecting-scope`](./inspection.md#inspecting-scope) — read the requirement tree and finalization status for a session.
- [`inspecting-queue`](./inspection.md#inspecting-queue) — read per-domain work-queue state.
- [`resolving-conflict`](./inspection.md#resolving-conflict) — resolve an escalated scope requirement during sign-off.

### Cataloguing
- `querying-items` — list items in a domain for reuse checks.
- `upserting-item` — insert or update a durable item.
- `linking-requirement` — associate a requirement with one or more items.
- `resolving-item-conflict` — mark an ambiguous catalogue decision as escalated or resolved.

## Commands

Trellis exposes only a small number of slash commands. Commands are interactive shortcuts, not part of the agent tool registry:

- `/scoping-item` — start a scoping session via the command palette.
- `/building-item` — start building a ratified item.
- `/reviewing-item` — start reviewing a built item.
- `/cataloging-project` — catalog existing project items.
- `/inspecting-tree` — open the interactive session/agent inspector overlay.
- `/managing-domains` — open the interactive domain browser and editor overlay.

## Conventions

- All params use [TypeBox](https://github.com/sinclairzx81/typebox) schemas.
- String enums use the extension's `StringEnum` helper.
- Tool `execute` functions return a result with:
  - `content` — human-readable text shown in the Pi conversation.
  - `details` — structured data used by the TUI, storage adapter, and model.
- Errors are surfaced by throwing from `execute`.

## Status

- **Implemented**: `creating-domain`, `getting-domain`, `updating-domain`, `deleting-domain`, `listing-domains`, and the SQLite storage adapter they use.
- **Drafted**: remaining tools and commands.
