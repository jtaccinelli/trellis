# Trellis Style Guide

Conventions we follow so the codebase, docs, and agent definitions stay consistent. When you introduce a new pattern, add it here and link it from `AGENTS.md`.

## Naming

### Words, not abbreviations

- **Never abbreviate identifiers**, no matter how common the short form is.
  - `databasePath`, not `dbPath`
  - `identifier`, not `id` (where feasible; existing primary-key columns may keep `id` until explicitly migrated)
  - `environment`, not `env`
  - `processIdentifier`, not `processPid`
- This applies to variables, properties, parameters, environment variable names, and configuration keys.

## Imports and module paths

- **Always use absolute imports** with the `~/*` path alias, never relative `../` paths.
  ```typescript
  // good
  import type { StorageAdapter } from "~/extensions/storage/types.ts";

  // bad
  import type { StorageAdapter } from "../storage/types.ts";
  ```
- Keep `.ts` extensions on imports so the project can run with `allowImportingTsExtensions` andTypeScript-aware loaders.

## Naming

### Tools and commands

- Use **gerund-noun** pairing (present participle + noun).
  - Tools: `scoping-item`, `delegating-requirement`, `spawning-agent`, `sending-message`
  - Commands: `/scoping-item`, `/cataloging-project`, `/inspecting-tree`
- Do **not** prefix with `trellis_`. The extension provides the namespace.

### Runtime managers

- Manager files must follow `_____-manager.ts`:
  - `queue-manager.ts`
  - `notification-manager.ts`
  - `coordinator-manager.ts`

## File organization

- **One tool per file** under `extensions/tools/` (mirrored by domain area).
- **One command per file** under `extensions/commands/`.
- Keep managers in `extensions/managers/` as deterministic, event-driven runtime components.
- Put small, generic helpers in `extensions/utils.ts`. If a helper grows domain logic, promote it to a manager, tool, or dedicated module.

## Documentation

- This repo is **documentation-first while the architecture stabilizes**. Before changing behavior, update the relevant docs:
  - `docs/40-architecture/` for subsystems
  - `docs/50-api/` for tool schemas
  - `docs/60-data-model/` for entities and schema
  - This style guide for new conventions
- When a convention is invented in conversation, capture it here and link from `AGENTS.md`.

## Storage and persistence

- The `StorageAdapter` is the source of truth.
- Use SQLite via `node:sqlite`; do not add `better-sqlite3`.
- Migrations are **explicit** and must be called intentionally after schema review.
- Use `tool_result.details` and `pi.appendEntry()` only for transient, model-visible summaries.

## TypeScript

- Run `pnpm run check` before considering a change complete.
- Use `verbatimModuleSyntax` and `.ts` file extensions.
- Order imports into groups separated by blank lines:
  1. Package imports (`node:*`, npm scopes)
  2. `import type ...` from project files
  3. Regular `import ...` from project files
- Alphabetise imports within each group by module path.
- Prefer imports from `~/extensions/...` over relative paths or repeated inline helpers.
  - This works for `tsc`, `tsx`, and tests.
  - Pi's runtime loader does **not** resolve `~/*`, so `pnpm run build` bundles the extension and rewrites the paths; the bundled entry point in `dist/extensions/index.js` is what Pi loads.

Example:

```typescript
import { DatabaseSync } from "node:sqlite";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { DomainHandler } from "~/extensions/storage/domains/handler.ts";
import { MigrationHandler } from "~/extensions/storage/migrations/handler.ts";
import { json, parseJson } from "~/extensions/utils.ts";
```

## Agent definitions

- Agent definitions live in `extensions/agents/*.md` with frontmatter (`name`, `description`, `tools`, `thinking`) and a system-prompt body.
- Clearly enumerate allowed tools and off-limits behavior.
- Coordinators route and orchestrate; domain agents assess/build.
- Do not let coordinators poll messages; completion notifications are pushed by the notification manager.
