# Work Item

A **work item** is the dispatchable unit placed on a domain’s FIFO queue by a coordinator.

## Purpose

Work items decouple the coordinator from the domain agent. The coordinator creates a requirement and delegates it; the extension’s queue manager turns that delegation into a work item and eventually into one ephemeral domain-agent run.

## Lifecycle

```
queued → running → done | failed
```

## Properties

- Owned by exactly one domain queue.
- References exactly one scope requirement.
- Records which coordinator enqueued it.
- Tracks the ephemeral domain agent currently processing it.

## Flow

1. Coordinator calls `delegating-requirement(domain_id, requirement_id)`.
2. A work item is appended to the domain queue with status `queued`.
3. If no domain agent is running for that domain, the queue manager marks the item `running` and spawns a domain agent.
4. The domain agent finishes and exits; the queue manager records the result, marks the item `done` (or `failed`), and spawns the next agent if the queue still has items.

## See also

- [Scope requirement](./requirement.md)
- [Domain agent](./agents/domain-agent.md)
- [Architecture: Delegation](../40-architecture/delegation.md)
- [Architecture: Queue management](../40-architecture/queue-manager.md)
- [Data model: WorkItem](../60-data-model/entities.md)
