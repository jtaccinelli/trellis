# Trellis

A [Pi](https://pi.dev) extension that turns raw child-process subagents into a structured system for planning, implementing, reviewing, and deploying software work.

## What this is

Trellis coordinates focused child `pi` processes around a shared domain model. Instead of one big context window trying to plan and execute everything, work is partitioned into domains, each with its own queue, agent definitions, and durable items.

The extension provides:

- **Planning** — recursive, antagonistic scoping that delegates requirements to domain specialists and ratifies a final scope document.
- **Implementing** — build waves that turn ratified scope into concrete artifacts, with automated QA per item.
- **Reviewing** — contract validation and refinement loops against durable item contracts.
- **Deploying** — final approval, branch/PR creation, and merge-to-main orchestration.

## Status

**Documentation-first, implementation-light.** The architecture, API surface, data model, and workflows are written up in `docs/`. The first implemented pieces are the SQLite storage adapter, the `defining-domain` and `listing-domains` tools, and the runtime-manager stubs. Implementation is proceeding from the core Planning/Scoping loop because it exercises all the primitives (coordinator agents, domain agents, the extension queue manager, shared queues, and storage adapter).

## Documentation

All design work is captured under `docs/`:

| Section | What it covers |
|---|---|
| [`docs/01-overview/`](docs/01-overview/) | Goals, non-goals, status |
| [`docs/10-concepts/`](docs/10-concepts/) | Agents, coordinator agent, queue manager, domains, requirements, items, lineage |
| [`docs/20-user-guide/`](docs/20-user-guide/) | Install, commands, tool usage (mostly planned) |
| [`docs/30-authoring/`](docs/30-authoring/) | Bundled agent definitions and prompt templates |
| [`docs/35-actions/`](docs/35-actions/) | Repeatable workflows such as cataloguing items |
| [`docs/40-architecture/`](docs/40-architecture/) | Subsystems and Trellis → Pi primitive mapping |
| [`docs/50-api/`](docs/50-api/) | Tool schemas and behavior |
| [`docs/60-data-model/`](docs/60-data-model/) | Entities, persistence boundary, SQLite schema |
| [`docs/70-planning/`](docs/70-planning/) | Roadmap, decision log, risks |

`AGENTS.md` in this repo is automatically loaded by Pi as a context file for new sessions. Capture architectural intent and conventions there.

## Install

Trellis uses `~/*` TypeScript path aliases for type-checking, but Pi's runtime loader does not resolve them. A small build step bundles the extension to `dist/extensions/index.js`.

Build before loading:

```bash
pnpm install
pnpm run build
```

### From this repo (once pushed to GitHub)

```bash
pi install git:github.com/jtaccinelli/trellis
```

Or pin a tag/commit:

```bash
pi install git:github.com/jtaccinelli/trellis@v0.1.0
```

### Local development

```bash
# load the built extension for the current run only
pi -e ~/Sites/trellis

# or copy/symlink the built entry point into Pi's auto-discovery path
ln -s ~/Sites/trellis/dist/extensions/index.js ~/.pi/agent/extensions/trellis.js
```

## Structure

```
trellis/
├── AGENTS.md           # Pi context file: intent, architecture, conventions
├── docs/               # design docs and API reference
│   ├── 01-overview/
│   ├── 10-concepts/
│   ├── 20-user-guide/
│   ├── 30-authoring/
│   ├── 35-actions/
│   ├── 40-architecture/
│   ├── 50-api/
│   ├── 60-data-model/
│   └── 70-planning/
├── extensions/
│   ├── index.ts        # extension entry point
│   ├── agents/         # bundled agent definitions
│   ├── commands/       # slash commands
│   ├── managers/       # deterministic runtime managers
│   ├── storage/        # SQLite storage adapter and table handlers
│   ├── tools/          # extension tools (one file per tool)
│   └── utils.ts        # tiny shared helpers
├── dist/               # built extension output (run `pnpm run build`)
├── docs/               # design docs and API reference
├── package.json        # pi manifest under "pi.extensions"
└── tsconfig.json
```

## Development notes

- Runtime deps go in `dependencies`; core pi packages (`@earendil-works/pi-*`, `typebox`) should be `peerDependencies` with `"*"` — pi bundles them.
- TypeScript is checked with `tsc --noEmit` and bundled for Pi with `esbuild` (`pnpm run build`). Database schemas are copied to `dist/` so the migration runner can read them at runtime.
- Extensions run with full system permissions. Review before installing third-party code.

## Next steps

See [`docs/70-planning/roadmap.md`](docs/70-planning/roadmap.md) for the full roadmap. The immediate priority is the Planning/Scoping loop: static bundled agents, the launcher, shared domain queues, `trellis_scope`, and `trellis_delegation`.
