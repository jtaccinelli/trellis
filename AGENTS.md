# Trellis — Agent Context

Trellis is a Pi extension that turns Pi’s raw subagent primitive into a structured, observable system for planning, implementing, reviewing, and deploying software work.

## Current intent

This repo is now **file-first**: the source files in `extensions/` and the bundled agent definitions in `extensions/agents/` are the canonical source of truth. The previous documentation tree has been removed. Read the files first, edit the files, and only write new documentation when explicitly asked.

The active phase is implementing the Planning/Scoping loop end-to-end:

1. Recursive scoping with coordinator and domain agents.
2. Shared per-domain FIFO queues and deterministic domain-manager execution.
3. WebSocket-based inter-agent lifecycle events and one-to-one messages.
4. SQLite-backed sessions, domains, requirements, work items, items, messages, and lineage.
5. TUI overlays/reader commands for scope status and sign-off when requested.

Feature work still maps to one of four user-initiated processes:

- **Planning** — scoping, design, item cataloguing
- **Implementing** — build waves, worker agents, automated QA
- **Reviewing** — contract validation, refinement loops, human sign-off
- **Deploying** — merge gate, CI, merging to `main`

## Architectural center of gravity

- **Coordinator agents** own request context and drive the loop. They are persistent RPC agents.
- **Domain agents** are one-shot JSON assessors/builders for a single work item.
- **Background agents** are one-shot JSON helpers spawned by coordinators.
- The **extension domain manager** serializes domain-agent execution per domain via shared queues.
- The **extension queue manager** is not an agent; it owns the FIFO queue.
- **Shared domain queues** decouple coordinators from worker lifecycle.
- **WebSocket event bus** carries transient lifecycle events (e.g. `trellis:agent_settled`) between spawned agents, their spawners, and the root process.
- **Storage adapter** (SQLite default) is the source of truth for sessions, domains, requirements, work items, items, messages, and lineage.
- Persistence in `tool_result.details` and `pi.appendEntry()` is only for transient, model-visible summaries.

Extension factories distinguish **root mode** from **agent mode** via `process.env.TRELLIS_AGENT_ID`.

## Agent lifecycle

- Domain and background agents are launched in JSON mode, run a single turn, come to rest, publish `trellis:agent_settled` to their spawner and to `trellis:root`, then exit.
- Coordinator agents are launched in RPC mode, stay alive across prompts, and publish `trellis:agent_settled` every time they come to rest so the spawner/root knows they are idle.
- When an agent process exits, the parent `AgentManager` still emits the durable `trellis:agent_closed` event and updates storage as a fallback.

## Non-goals

- Do not reimplement the full `pi-subagents` runtime (missions, watchdog, Herdr, Orca, external runners).
- Do not build a custom LLM client.
- Do not treat Pi’s native session storage as a database or queue.
- No runtime discovery of new agents or domains from user/project directories; all agent definitions are bundled.

## How to continue work

1. Read the relevant files in `extensions/` before changing anything.
2. Make the change in code first.
3. If you add a new subsystem (manager, tool, storage handler), keep its public surface small and typed via `extensions/managers/types.ts` or `extensions/storage/types.ts`.
4. Only create or restore docs when the user explicitly asks for them.

## First implementation priorities

1. Stabilize the WebSocket lifecycle so agents publish `trellis:agent_settled` to their spawner and root when they come to rest.
2. Ensure one-shot JSON agents (domain/background) exit cleanly after that event, while RPC coordinators stay alive for further input.
3. Harden the launcher contract: env vars, prompt injection, stdout/exit capture.
4. Finish the recursive scoping loop through `delegate-requirement`, `list-scope`, and queue completion events.
5. Storage adapter completeness and migrations.
6. TUI overlays/readers as needed.

## Notes for the model

- Prefer reading and editing files over writing/updating documentation unless asked.
- Keep the extension self-contained: bundled agents, bundled prompts, project-based domains.
- Use the storage adapter as the source of truth; use `details` on tool results only for model-readable snapshots.
