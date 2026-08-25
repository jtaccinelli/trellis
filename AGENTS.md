# Trellis — Agent Context

Trellis is a Pi extension that turns Pi’s raw subagent primitive into a structured, observable system for planning, implementing, reviewing, and deploying software work.

> For coding conventions, see [`docs/80-style-guide/index.md`](./docs/80-style-guide/index.md). Add new style rules there as they emerge.

## Current intent

This repo is currently **documentation-first and implementation-light**. The extension entry point (`extensions/index.ts`) is only a stub. The goal of the current phase is to:

1. Finalize the architecture and workflow definitions documented in `docs/`.
2. Map every feature to one of four user-initiated processes:
   - **Planning** — scoping, design, item cataloguing
   - **Implementing** — build waves, worker agents, automated QA
   - **Reviewing** — contract validation, refinement loops, human sign-off
   - **Deploying** — merge gate, CI, merging to `main`
3. Implement the system incrementally, starting with the Planning/Scoping loop because it exercises all core primitives.

## Architectural center of gravity

- **Coordinator agents** own request context and drive the loop.
- **Domain agents** are one-shot assessors/builders for a single work item.
- The **extension queue manager** (not an agent) serializes domain-agent execution per domain.
- **Shared domain queues** decouple coordinators from worker lifecycle.
- **Storage adapter** (SQLite default) is the source of truth for sessions, domains, requirements, work items, items, messages, and lineage.
- Persistence in `tool_result.details` and `pi.appendEntry()` is only for transient, model-visible summaries.

Extension factories distinguish **root mode** from **agent mode** via `process.env.TRELLIS_AGENT_ID`.

## Non-goals

- Do not reimplement the full `pi-subagents` runtime (missions, watchdog, Herdr, Orca, external runners).
- Do not build a custom LLM client.
- Do not treat Pi’s native session storage as a database or queue.
- No runtime discovery of new agents or domains from user/project directories; all agent definitions are bundled.

## How to continue work

Before writing code, read or update the docs. The canonical structure is:

- `docs/01-overview/index.md` — goals and status
- `docs/10-concepts/index.md` — domain, agent, requirement, item, lineage
- `docs/35-actions/index.md` — workflows such as cataloguing items
- `docs/40-architecture/` — subsystems (launcher, delegation, queues, messaging, storage, rendering)
- `docs/50-api/` — tool schemas
- `docs/60-data-model/` — entities and SQLite schema
- `docs/70-planning/` — roadmap, decisions, risks

When adding a new feature, first add/update the relevant `docs/40-architecture/` and `docs/50-api/` pages, then implement. This keeps the design explicit and reviewable.

## First implementation priorities

1. Static bundled agent catalog (`agents/*.md`) for coordinator and domain-agent.
2. Launcher contract: spawn child `pi` processes with role env vars and system-prompt injection.
3. Shared domain queue managed by the extension queue manager.
4. `trellis_scope` and `trellis_delegation` tools driving the recursive scoping loop.
5. Storage adapter interface and SQLite backend for sessions, domains, requirements, work items.
6. TUI overlays/readers for scope status and sign-off.

## Notes for the model

- Prefer editing docs before editing code while the architecture is still stabilizing.
- Keep the extension self-contained: bundled agents, bundled prompts, project-based domains.
- Use the storage adapter as the source of truth; use `details` on tool results only for model-readable snapshots.
