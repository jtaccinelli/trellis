# Scoping Tools

## `scoping-item`

Start a recursive, antagonistic, domain-scoped planning session for a work item.

### Purpose

Turn a raw user request into a ratified scope document that partitions work across project-defined domains. The session runs until all domain queues are stable and no new requirements are produced, then gates the final scope on human approval.

### Who calls it

The **user** calls this directly from the root Pi session, or types `/scoping-item`. It is a foreground, streaming tool.

### Schema

```typescript
Type.Object({
  request: Type.String({ description: "User request to scope" }),
  parent_coordinator_id: Type.Optional(Type.String()),
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `request` | yes | The raw user request to plan around. |
| `parent_coordinator_id` | no | When this coordinator is a child of another coordinator, the parent's id. |

### What happens

1. The extension creates a **session** record and a **root coordinator** for it.
2. The coordinator creates the first scope requirement(s) from `request`.
3. For each requirement, the coordinator calls [`delegating-requirement`](#delegating-requirement) to enqueue it on the assigned domain's shared queue.
4. The extension queue manager spawns fresh **domain agents** serially and records their assessments.
5. The coordinator reads completed assessments and may enqueue any new requirements they produce.
6. If a requirement bounces between domains too many times, it becomes **escalated**.
7. The loop stops when all queues are stable and no new requirements appear.
8. The final scope is presented for human sign-off.

### Result

```typescript
{
  content: [{ type: "text", text: summary }],
  details: {
    session_id: string,
    status: "scoping" | "awaiting_approval" | "approved" | "rejected" | "abandoned",
    final_scope_document_id?: string,
    escalations: Conflict[],
  }
}
```

### Example prompt

> "Scope a new user-profile feature: allow users to upload an avatar, crop it, and store it in S3. The backend is TypeScript/Express and the frontend is React."

Trellis will run the recursive scoping loop and return a draft scope document with ownership per domain and any conflicts flagged for you.

### See also

- [Domain agents](../10-concepts/agents/domain-agent.md)
- [Coordinator runtime](../40-architecture/coordinator-runtime.md)
- [API reference: scoping-item](../50-api/scoping-item.md)

---

## `delegating-requirement`

Internal coordinator tool used to hand a scope requirement to a domain's shared work queue.

### Purpose

Coordinators never spawn domain agents directly. They write work items into the extension-managed queue and the **queue manager** handles the rest.

### Who calls it

**Coordinator agents** only. End users do not call this directly.

### Schema

```typescript
Type.Object({
  domain_id: Type.String({ description: "Domain that should assess the requirement" }),
  requirement_id: Type.String({ description: "Requirement to delegate" }),
  parent_coordinator_id: Type.Optional(Type.String()),
  priority: Type.Optional(Type.Number()), // controls FIFO ordering within the domain queue
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `domain_id` | yes | Target domain that will assess the requirement. |
| `requirement_id` | yes | Requirement to enqueue. |
| `parent_coordinator_id` | no | Parent coordinator for lineage. |
| `priority` | no | Lower numbers run first; defaults to insertion order. |

### What happens

1. Validate that `requirement_id` is assigned to `domain_id` in the storage adapter.
2. Create a `WorkItem` on that domain's shared FIFO queue.
3. If no domain agent is currently running, the queue manager pulls the head item, marks it `running`, and spawns a fresh domain agent.
4. When the agent exits, the queue manager stores the result and notifies the originating coordinator via a queue-manager message.

At most **one** domain agent runs per domain at any moment.

### Result

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

### See also

- [Delegation model](../40-architecture/delegation.md)
- [Queue manager](../40-architecture/queue-manager.md)
- [API reference: delegating-requirement](../50-api/delegating-requirement.md)
