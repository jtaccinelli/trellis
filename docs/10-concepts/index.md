# Core Concepts

These terms are used throughout the rest of the docs. Each concept maps to either a Pi primitive (tool, session entry, child process) or a Trellis data entity.

## Agent model

All agent-related concepts are grouped under [`agents/`](./agents/):

| Concept | Description |
|---|---|
| [Agent definition](./agents/agent.md) | Declarative specialist bundled with Trellis. |
| [Subagent](./agents/subagent.md) | Any running instance of an agent. |
| [Coordinator agent](./agents/coordinator-agent.md) | Drives the scoping/build loop. |
| [Domain agent](./agents/domain-agent.md) | One-shot worker per work item. |

## Work model

| Concept | Description |
|---|---|
| [Domain](./domain.md) | Project-defined area of responsibility. |
| [Scope requirement](./requirement.md) | Transient unit of work under evaluation. |
| [Work item](./work-item.md) | Dispatchable unit placed on a domain queue. |
| [Contract](./contract.md) | Cross-domain dependency with output shape and verdict. |
| [Item](./item.md) | Durable named artifact inside a domain. |

## Runtime pieces

| Concept | Description |
|---|---|
| [Queue manager](../40-architecture/queue-manager.md) | Extension-runtime component that serializes domain-agent execution per domain. Not an agent. |

## Hierarchy and messaging

| Concept | Description |
|---|---|
| [Lineage](./lineage.md) | Recorded tree of recursive subagent spawns. |

Messaging is one-to-one. The domain work queue is the primary coordination mechanism; the queue manager also sends direct notifications to coordinators when their work items complete. The user can send steering notes to running agents.

## Concept map

```
User request
    │
    ▼
Coordinator agent ── creates ──► Scope Requirement
    │                                   │
    │                              assigned to
    │                                   ▼
    │                       delegating-requirement()
    │                                   │
    │                                   ▼
    │                            Work Item
    │                                   │
    │                       queued on ──► Domain Queue
    │                                   │
    │                                   ▼
    │                         Extension Queue Manager
    │                                   │ spawns
    │                                   ▼
    │                           Domain Agent
    │                                   │
    │                                   ▼
    │                          Assessment / Build
    │                                   │
    │◄──────────────── result on exit
    │
    ▼
New requirements / contracts ──► loop again
    │
    ▼
Final scope + Item catalog
```

## See also

- [Data model](../60-data-model/)
- [Architecture](../40-architecture/)
- [API reference](../50-api/)
