# SQLite Schema

Default local storage for Trellis. The schema is intentionally minimal right now; only the `domains` table is implemented. Other tables will be added back through explicit migrations once their designs stabilize.

## Table organization

Each table lives in its own subfolder under `extensions/storage/`:

```text
extensions/storage/domains/
├── schema.sql   -- CREATE TABLE and initialising commands
├── types.ts     -- entity type
└── handler.ts   -- table-specific CRUD handler

extensions/storage/migrations/
├── schema.sql   -- migration tracker table
├── types.ts     -- migration record type
└── handler.ts   -- migration runner and tracker CRUD
```

The `SQLiteStorageAdapter` mounts each handler as a namespace:

```typescript
storage.domains.create(domain);
storage.domains.get(identifier);
storage.domains.list();
storage.migrations.apply(["domains"]);
```

## domains

`extensions/storage/domains/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  remit TEXT NOT NULL,
  exclusions TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
```

## migrations

`extensions/storage/migrations/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
```

The migration tracker uses the same subfolder pattern as any other table. `StorageAdapter.migrate()` delegates to `storage.migrations.apply(["domains"])`, which reads each table's `schema.sql` and records the applied version.

Domain hierarchy is not stored in the schema. Domains are flat, semantic categories; parent/child absorption relationships are inferred by agents at scoping time. If no existing domain claims a requirement, the coordinator flags a gap so a new domain can be created.
