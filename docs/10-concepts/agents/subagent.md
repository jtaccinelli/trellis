# Subagent

A **subagent** is a running instance of an agent — in Pi terms, a child `pi` process.

## Kinds of subagent in Trellis

| Kind | Lifetime | Purpose |
|---|---|---|
| **Coordinator agent** | Session-scoped | Owns a slice of request context and drives the scoping/build loop. |
| **Domain agent** | Ephemeral, one per work item | Performs scope assessment or build execution for exactly one requirement or item. |

## Independence

Coordinator agents and domain agents are independent. Domain agents are spawned by the extension’s queue manager, never directly by a coordinator agent.

## Queue management is not an agent

Serialization of domain-agent runs is handled by the extension-runtime **queue manager**, not by a subagent. This keeps queue logic deterministic and avoids giving a dying agent responsibility for spawning its own replacement.

## See also

- [Agent](./agent.md)
- [Coordinator agent](./coordinator-agent.md)
- [Domain agent](./domain-agent.md)
- [Architecture: Delegation](../../40-architecture/delegation.md)
- [Architecture: Queue management](../../40-architecture/queue-manager.md)
