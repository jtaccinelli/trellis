# Roadmap

Work is organized by functional area, not by long-term phases. Everything listed here is part of the current build unless marked as a future consideration.

## Foundation

- [x] Scaffold extension (`extensions/index.ts`, `package.json`, `tsconfig.json`).
- [ ] Confirm `pi -e ./extensions` loads and `session_start` fires.
- [ ] Decide project identity and user-facing tool names.

## Agent definitions

- Define `AgentConfig` shape.
- Bundle static `agents/*.md` inside the Trellis package: `coordinator`, `domain-agent`.
- Expose the static catalog via `resources_discover`.
- Map domains to agent definitions via `creating-domain`.
- Queue management lives in the extension runtime, not an agent.

## Launcher

- Launch coordinator subagents and domain-agent subagents.
- Inject role/identity env vars so the extension factory knows which loop to run.
- Abort escalation (`SIGTERM` → `SIGKILL`) and temp-file cleanup.

## Shared domain queues

- `WorkItem` table with `enqueued_by_coordinator_id`.
- FIFO queue per domain in the storage adapter.
- Extension queue manager that serializes access to each domain queue.
- Spawn / exit-reap cycle so that only one domain-agent instance exists at a time.
- Records work-item completion and retries on failure.

## Domain agents

- Ephemeral agent spawned fresh for each work item.
- Performs scope assessment for exactly one requirement and returns its result.
- Torn down immediately after its result is recorded.

## Items

- `Item` table for durable domain leaves.
- Reuse guardrails: check existing items before creating new ones.
- `CONTRACT.md`-style contract storage per item.
- `REFERENCES.md` and domain `INVENTORY.md` generated from item sources.

## Coordinator runtime

- Root coordinator creation from `scoping-item`.
- Child coordinator spawning for partitioned context slices.
- Enqueue requirements via `delegating-requirement`.
- Oscillation detection and escalation to user.
- Final scope assembly and sign-off gate.

## Rendering & UX

- `renderCall`/`renderResult`.
- Live status for scoping sessions and domain queues.

## Workflow prompts

- `prompts/*.md` shipped via `package.json` `pi` fields.

## Background & coordination

- Ad-hoc background subagent spawning via `spawning-agent`.
- Steering.
- Workflow script.
- Budgets.

_Future consideration until the foreground primitive is solid._

## One-to-one messaging / notifications

- `send` / `recv` for user steering notes to running agents.
- Queue-manager notifications to coordinators when their work items complete.

_Future consideration until the foreground primitive is solid._

## Lineage and spawn

- Recursive child-agent spawn via `spawning-agent`.
- Shared agent registry with parent/child links.
- Recursion guards.

_Future consideration until the foreground primitive is solid._

## TUI

- `/inspecting-tree` inspector.
- Persistent `inspecting-tree` widget.
- Custom renderers for scope, delegation, spawn, and messaging tools.

_Future consideration until the foreground primitive is solid._

## Recursive scoping engine

- Domain taxonomy and relationships.
- Scope-requirement lifecycle.
- Conflict resolution and sign-off gate.

_Future consideration; depends on stable messaging and delegation primitives._
