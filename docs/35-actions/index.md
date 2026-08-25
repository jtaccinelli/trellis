# Actions / Workflows

This section defines the repeatable processes that Trellis performs. Each action is a coherent workflow made up of one or more subagent steps, tool calls, and storage transitions.

Actions are implemented by combinations of:

- **Coordinator agents** — request slicing, orchestration, final sign-off.
- **Extension queue manager** — serial consumption of each domain's work queue.
- **Domain agents** — ephemeral, single-work-item assessment or build execution.
- **Storage adapter** — durable state for sessions, requirements, items, and messages.

## Current actions

- [Cataloguing items](./cataloguing-items.md) — deciding whether a need becomes a new item, reuses an existing item, or is satisfied by a contract.

## Future actions

- Scoping a request (`scoping-item`).
- Delegating a requirement (`delegating-requirement`).
- Building an item.
- Self-documenting a domain.
- Visualizing consumption.
