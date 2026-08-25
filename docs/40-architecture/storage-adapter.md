# Storage Adapter

Trellis needs queryable durable storage for sessions, domains, scope requirements, work items, and messages. Native Pi persistence is not enough.

## Boundary

Plugin code depends only on a `StorageAdapter` interface. Backends:

1. **SQLite** (default): `.pi/trellis/store.db` or project-local store.
2. **Cloudflare** (later): D1 or KV once the relational model stabilizes.

## Interface responsibilities

- Domain CRUD.
- Migration tracker and runner.
- Item CRUD + reuse lookup per domain.
- Session + scope requirement CRUD.
- Work-item queue operations (enqueue, dequeue-by-domain, mark-done).
- Message append and poll (one-to-one only).
- Absorbed-log CRUD + similarity lookup.

## Pi persistence boundaries

- `tool_result.details`: structured data visible to the model and stored for branching/compaction.
- `pi.appendEntry("trellis-*", data)`: transient session-visible state; not a DB.
- `ctx.sessionManager.getBranch()`: used on `session_start` to reconstruct summaries.

The SQLite backend is the source of truth; native Pi entries are secondary, model-readable snapshots.

## See also

- [Data model](../60-data-model/)
