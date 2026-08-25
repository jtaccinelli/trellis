# Trellis → Pi Primitives

This is the alignment layer: every Trellis concept is implemented through a specific Pi extension API primitive.

## Custom tools — `pi.registerTool()`

All Trellis functionality is delivered as custom tools. Tools use gerund-noun naming and do not carry a `trellis_` prefix:

- `scoping-item`
- `delegating-requirement`
- `spawning-agent`
- `sending-message`, `receiving-message`
- `listing-agents`
- `creating-domain`, `listing-domains`
- `inspecting-scope`, `inspecting-queue`
- `resolving-conflict`

Each tool follows the standard tool contract:

- `parameters` defined with `typebox` (use `StringEnum` from `@earendil-works/pi-ai` for Google-compatible enums).
- `execute(toolCallId, params, signal, onUpdate, ctx)`.
- Always return `content` (model-visible) and `details` (TUI/state).
- Throw to mark `isError: true`.
- Use `onUpdate` for non-blocking progress streaming.

### Ambient tools

Messaging and spawn tools must be registered in both root mode and agent mode so any running subagent can call them.

## Tool result `details`

Structured state belongs in `details` on every tool result. This is the canonical way to survive compaction and `/tree` branching in Pi.

Examples:

- Full child transcript, usage, and stderr from a delegated agent.
- Scope-requirement tree snapshot from `inspecting-scope`.
- Message pointers, work-item receipts, and notification cursors.

## Session persistence — `pi.appendEntry()` and `ctx.sessionManager`

- Native Pi persistence (`tool_result.details`, `pi.appendEntry`) is for **model-visible or transient state summaries only**.
- It is not a database: no joins, no FIFO queue semantics, no cheap similarity queries.
- Reconstruct in-memory views in `session_start` by scanning `ctx.sessionManager.getBranch()`.

## Lifecycle events

- `session_start` — build in-memory coordinator/agents state from storage and session entries.
- `session_shutdown` — terminate lingering children, flush registry.
- `resources_discover` — contribute bundled `prompts/` and `agents/` paths.

## TUI

- `renderCall`/`renderResult` on each tool: collapsed/expanded, status icons, tool-call formatting, usage.
- Persistent widget: `ctx.ui.setWidget("inspecting-tree", ...)`.
- Interactive inspector: `ctx.ui.custom({ overlay: true })`.

## Commands

- `/inspecting-tree` opens the agent-tree inspector via `pi.registerCommand()`.
- `/scoping-item`, `/building-item`, `/reviewing-item`, and `/cataloging-project` provide command-palette entry points into the four user processes.

## Resource discovery

- `agents/*.md` and `prompts/*.md` are contributed in `resources_discover` so Pi loads them as bundled package resources.
- Agents are static; user- or project-level agent directories are intentionally not supported.

## Process model

- A subagent is a real `pi` child process, not an in-process model call.
- Use `pi.exec()` (or `node:child_process` via `getPiInvocation`) to launch.
- Honor `ctx.signal` → `SIGTERM`, then `SIGKILL` after 5s.

## File-system coordination

- Use `withFileMutationQueue()` for any shared-file mutation (registry, inboxes) so parallel tool calls do not race.
- Append-only logs use atomic `writeFile(..., { flag: "a" })` or temp+rename for `meta.json`.
