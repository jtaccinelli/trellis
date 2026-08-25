# `scoping-item`

Start a recursive, antagonistic, domain-scoped scoping session for a work item.

## Schema

```typescript
Type.Object({
  request: Type.String({ description: "User request to scope" }),
  parent_coordinator_id: Type.Optional(Type.String()),
});
```

## Behavior

1. Create session record and root coordinator.
2. Create initial scope requirement(s).
3. For each requirement, the coordinator calls `delegating-requirement` to enqueue a work item on the target domain's shared queue.
4. Loop:
   - The extension's queue manager serializes execution, spawning a fresh domain agent for each work item and recording the assessment (owned sub-scope, contracts, absorption notes) when the agent exits.
   - Coordinator records each assessment and tracks how many times a requirement has been reassigned to a different domain.
   - If a requirement bounces too many times, the coordinator marks it `escalated` and stops the loop on that branch.
   - Otherwise, the coordinator enqueues any new requirements produced by the domain agents.
5. Stop when all queues are stable and no new requirements are produced.
6. Present final scope for human sign-off.

## Return

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

## Conflicts

- Domain agents are the only scope assessors.
- The coordinator escalates a requirement when domain agents keep reassigning it between domains past a bounce threshold.
- The user resolves escalated requirements via the sign-off gate or `resolving-conflict`.

## See also

- [Coordinator runtime](../40-architecture/coordinator-runtime.md)
