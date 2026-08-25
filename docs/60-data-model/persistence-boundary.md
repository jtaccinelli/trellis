# Persistence Boundary

Trellis uses three persistence mechanisms; each has a clear boundary.

## 1. Storage adapter — source of truth

Used for:

- Domains, sessions, scope requirements, work items.
- Queue operations (FIFO, dequeue, mark-done).
- Messages (one-to-one).
- Absorbed-log similarity lookup.

## 2. `tool_result.details` — model-visible reconstruction

Every tool result should include enough `details` for the model to reason about state and for Trellis to reconstruct across branching/compaction.

Examples:

- A delegation tool returns the full child transcript, usage, and final output.
- A scope status tool returns the requirement tree.

## 3. `pi.appendEntry()` — transient session-visible snapshots

Use for UI-only state such as:

- "Scoping started" status cards.
- Active agent tree snapshot.
- Final scope summary.

These entries survive session restarts but are not queryable or reliable for queue logic.

## Reconstruction on `session_start`

```typescript
for (const entry of ctx.sessionManager.getBranch()) {
  if (entry.type === "custom" && entry.customType.startsWith("trellis-")) {
    // hydrate in-memory view
  }
}
```

Always verify the in-memory view against the storage adapter, which is authoritative.
