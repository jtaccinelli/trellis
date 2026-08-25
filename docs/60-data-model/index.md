# Data Model

Trellis tracks structured state in a storage adapter (SQLite default). This section defines the entities and persistence strategy.

## Persistence layers

1. **Source of truth:** storage adapter (SQLite / Cloudflare).
2. **Session-visible summaries:** `tool_result.details`, `pi.appendEntry("trellis-*", ...)`.
3. **Reconstruction inputs:** `ctx.sessionManager.getBranch()` scanned on `session_start`.

## Entity list

- [Entities](./entities.md) — TypeScript interfaces for session, domain, item, domain agent, scope requirement, work item, message, absorbed log, and final scope document.
- [Persistence boundary](./persistence-boundary.md) — when to use the adapter vs Pi's native mechanisms.
- [SQLite schema](./sqlite-schema.md) — suggested SQL schema and migrations.
