# `delegating-requirement`

Internal coordinator tool used to hand a scope requirement to a domain's shared work queue.

## Schema

```typescript
Type.Object({
  domain_id: Type.String({ description: "Domain that should assess the requirement" }),
  requirement_id: Type.String({ description: "Requirement to delegate" }),
  parent_coordinator_id: Type.Optional(Type.String()),
  // priority controls FIFO ordering within the domain queue
  priority: Type.Optional(Type.Number()),
});
```

## Behavior

1. Validate that `requirement_id` is currently assigned to `domain_id`.
2. Enqueue a work item on the domain's shared queue.
3. Return a receipt containing the work-item id.

The extension's queue manager consumes work items serially. If no domain agent is running for the domain, it spawns a fresh domain agent. When that agent exits, the queue manager stores the result in the work item, sends a lightweight notification message to the originating coordinator (`from_agent_id: "queue-manager"`), and spawns the next agent if the queue still has items.

Only one instance of a given domain agent may run at any moment, enforced by the queue manager.

## Return

```typescript
{
  content: [{ type: "text", text: `Delegated <requirement> to <domain>; item <id>` }],
  details: {
    work_item_id: string,
    domain_id: string,
    requirement_id: string,
  }
}
```

## Relationship to user flow

End users do not call `delegating-requirement` directly. It is invoked by the coordinator runtime while a `scoping-item` session is active.

## See also

- [Delegation model](../40-architecture/delegation.md)
- [Coordinator runtime](../40-architecture/coordinator-runtime.md)
- [API: scoping-item](./scoping-item.md)
