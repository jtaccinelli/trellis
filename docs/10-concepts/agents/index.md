# Agent Model

Trellis builds behavior out of a small set of agent definitions and the runtime relationships between them.

## Agent definition

- [Agent](./agent.md) — declarative specialist bundled with Trellis as a markdown definition.

## Agent instances

- [Subagent](./subagent.md) — any running instance of an agent; a child `pi` process.

## Specialized agent roles

| Role | Description |
|---|---|
| [Coordinator agent](./coordinator-agent.md) | Owns request context and drives the scoping/build loop. Often shortened to **coordinator**. |
| [Domain agent](./domain-agent.md) | One-shot worker spawned for a single work item. |

## Non-agent runtime pieces

The **queue manager** is not an agent. It is an extension-runtime component that owns each domain’s FIFO queue, guarantees one domain agent runs at a time, and spawns the next agent when the previous one exits. See [Architecture: Queue management](../40-architecture/queue-manager.md).

## Relationship to Pi

Every Trellis *agent* maps to a child `pi` process launched in `--mode json -p --no-session`. The extension factory distinguishes coordinator-agent mode from domain-agent mode via env vars such as `TRELLIS_ROLE` and `TRELLIS_AGENT_ID`. The queue manager lives in the extension’s root process and never runs as a child.

## See also

- [Authoring: Agent definitions](../../30-authoring/agent-definitions.md)
- [Architecture: Launcher](../../40-architecture/launcher.md)
- [Architecture: Delegation](../../40-architecture/delegation.md)
