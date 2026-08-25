# Inspection & Conflict Resolution Tools

These tools let the user (and running agents) observe session state and resolve scope conflicts that the coordinator escalated.

## `inspecting-scope`

Read the requirement tree and finalization status for a session.

### Purpose

Show where a scoping session stands: which requirements exist, which domains own them, which are escalated, and whether the session is waiting for approval.

### Who calls it

The user or a long-lived agent.

### Schema

```typescript
Type.Object({
  session_id: Type.String(),
});
```

### Result

Compact summary when collapsed, structured tree when expanded.

```typescript
{
  content: [{ type: "text", text: summary }],
  details: {
    session_id: string,
    status: "scoping" | "awaiting_approval" | "approved" | "rejected" | "abandoned",
    requirements: RequirementTree,
    escalations: Conflict[],
    final_scope_document_id?: string,
  }
}
```

---

## `inspecting-queue`

Read per-domain work-queue state.

### Purpose

Show how many work items are queued, running, or done for each domain, plus the active agent ids. Useful for understanding why a session has not finished.

### Who calls it

The user or a long-lived agent.

### Schema

```typescript
Type.Object({
  session_id: Type.String(),
  domain_id: Type.Optional(Type.String()), // if omitted, returns all domains
});
```

### Result

```typescript
{
  content: [{ type: "text", text: summary }],
  details: {
    session_id: string,
    domains: Array<{
      domain_id: string,
      queued: number,
      running: number,
      done: number,
      failed: number,
      active_agent_id?: string,
    }>
  }
}
```

---

## `resolving-conflict`

Resolve an escalated scope requirement during sign-off.

### Purpose

When domain agents disagree about which domain owns a requirement, the coordinator marks it `escalated` and stops the loop on that branch. This tool lets the user decide the outcome.

### Who calls it

The user, inside the sign-off gate.

### Schema

```typescript
Type.Object({
  session_id: Type.String(),
  conflict_id: Type.String(),
  decision: StringEnum(["A", "B", "user_resolution"] as const),
  user_resolution: Type.Optional(Type.String()),
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `session_id` | yes | Session containing the conflict. |
| `conflict_id` | yes | Id of the escalated requirement/conflict. |
| `decision` | yes | `A` or `B` selects one of the two contending domains; `user_resolution` lets the user provide an explicit instruction. |
| `user_resolution` | no | Required when `decision` is `user_resolution`; free-text resolution. |

### What happens

- The coordinator rewrites the requirement's ownership according to the decision.
- If `user_resolution` is used, a new requirement is created with the user's text as its contract.
- The coordinator resumes the scoping loop if other requirements remain open.

### Result

```typescript
{
  content: [{ type: "text", text: "Resolved conflict <conflict_id>" }],
  details: {
    session_id: string,
    conflict_id: string,
    decision: "A" | "B" | "user_resolution",
    updated_requirement_id: string,
  }
}
```

### See also

- [Coordinator runtime](../40-architecture/coordinator-runtime.md)
- [API reference: inspection tools](../50-api/inspection.md)
