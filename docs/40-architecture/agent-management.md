# Agent management

The `AgentManager` owns the bundled agent catalog and the lifecycle of all child `pi` processes spawned by Trellis. Coordinators, the domain manager, and ad-hoc `starting-agent` calls all create agents through this single manager.

## Responsibilities

- Crawl the bundled agent catalog in `extensions/agents/`.
- Load agent definitions (markdown with YAML frontmatter).
- Prepare command-line flags, runtime environment variables, and temporary system-prompt files for each child process.
- Spawn child `pi` processes and track them in `runningAgentProcesses`.
- Write every spawn and exit to the storage-backed `agents` registry so parents can inspect the whole agent tree.
- Capture stdout JSON events to compute usage and final `resultText`.
- Emit `trellis:agent_closed` when a child process exits or errors.

## Storage-backed registry

Every agent is recorded in the `agents` table regardless of who spawned it. The table is shared across all extension instances (root, coordinators, and ad-hoc background agents), so a coordinator’s children are visible to the root process without relying on in-memory state or cross-process events.

Registry fields include:

| Field | Purpose |
|---|---|
| `id` | Spawned agent id |
| `parent_id` | Agent id of the spawning agent |
| `request_id` | Request the agent belongs to |
| `role` | `coordinator`, `domain`, or `background` |
| `name` | Bundled agent definition name |
| `status` | `running`, `completed`, `failed`, or `stopped` |
| `pid` | OS process id |
| `log_path` | Path to JSONL context log |
| `task_preview` | First 500 characters of the task |
| `started_at` / `exited_at` | Process timestamps |
| `exit_code` / `result_text` | Exit metadata |
| `domain_id` / `queue_item_id` | Domain queue linkage |

## Listing agents

The `listing-agents` tool reads from storage and overlays live process state from the local `AgentManager`. It can therefore surface agents spawned by other agents, not just the ones tracked in the current process.

## Registry lifecycle

The `agents` table is a runtime process registry, not an audit log:

- `AgentManager` inserts a row with `status = running` immediately after `spawn()`.
- The same `AgentManager` updates the row to `completed` or `failed` when the child process exits.
- When the root session starts, any stale rows left by a previous crashed session are deleted.
- When the root session ends, all remaining rows are cleared.

This keeps the registry bounded and prevents stale rows from surviving a pi restart.

## Context logs

Every spawned agent writes a JSONL context log to a file under:

```
.pi/trellis/logs/<session_start_timestamp>/<agent_id>.jsonl
```

The `<session_start_timestamp>` is inherited from `process.env.TRELLIS_SESSION_START`, which the root extension sets when the session begins. This groups all agents from the same pi session under one timestamped directory.

Each line is a JSON object with:

```json
{
  "timestamp": 1787699123456,
  "stream": "stdout",
  "line": "...raw JSON event text...",
  "event": { "type": "message_end", ... }
}
```

Events include lifecycle markers (`agent_spawned`, `agent_exited`, `agent_error`) and the parsed stdout event stream. stderr is captured as `stream: "stderr"` lines.

The `agents.log_path` column points to this file, so `listing-agents` and future `getting-agent` tooling can surface live context without needing to write every event to SQLite.

## Spawned process

The launch mode comes from the agent definition frontmatter (`mode: json` or `mode: rpc`) and defaults to `json`.

### One-shot agents (`json`)

```bash
pi --mode json -p --no-session \
   --model <model> --thinking <level> \
   --tools <tools> \
   -e <extension-entry> \
   --append-system-prompt <temp-prompt.md> \
   <task>
```

These agents run a single assistant turn and exit.

### Persistent agents (`rpc`)

```bash
pi --mode rpc -p --no-session \
   --model <model> --thinking <level> \
   --tools <tools> \
   -e <extension-entry> \
   --append-system-prompt <temp-prompt.md>
```

Persistent agents stay alive after the first turn. `AgentManager` opens stdin and sends the initial task as an RPC `prompt` command:

```json
{"type":"prompt","message":"<task>"}
```

Later turns are delivered by calling `AgentManager.sendRpcCommand(agentId, command)`, which writes a JSONL command to the child’s stdin. This is used by `CoordinatorManager` to steer root coordinators after they have spawned.

The extension loads in **agent mode** when `TRELLIS_AGENT_ID` is present, registering only the tools appropriate for that role.

## Runtime environment

The child process receives these Trellis-specific environment variables:

| Variable | Value |
|---|---|
| `TRELLIS_AGENT_ID` | The spawned agent id |
| `TRELLIS_AGENT_NAME` | Bundled agent definition name |
| `TRELLIS_ROLE` | `coordinator`, `domain`, or `background` |
| `TRELLIS_REQUEST_ID` | Request id passed at spawn time |
| `TRELLIS_PARENT_ID` | Parent agent id when known |
| `TRELLIS_DOMAIN_ID` | Domain id for domain agents |
| `TRELLIS_QUEUE_ITEM_ID` | Queue item id for domain agents |
| `TRELLIS_WS_URL` | Root WebSocket hub URL |
| `TRELLIS_WS_TOKEN` | Shared token for WebSocket authentication |

## Tracking and events

`runningAgentProcesses` is a public `Map<agentId, AgentProcessHandle>`. The handle contains the child process, start timestamp, and a promise that resolves when the process exits.

When the child exits, `AgentManager`:

1. Removes the agent from `runningAgentProcesses`.
2. Cleans up the temporary prompt directory.
3. Emits `trellis:agent_closed` on `pi.events` with exit metadata and captured `resultText`.
4. Publishes `trellis:agent_closed` over `WebSocketManager` so other agents on the same request see it.

`AgentManager` also publishes `trellis:agent_spawned` when a child process starts. Other subsystems can listen for these events via `pi.events.on(...)` without coupling to the agent manager directly.

## Relationship to other docs

- [Events](./events.md) — how `trellis:agent_closed` is consumed.
- [WebSocket server manager](./websocket-server-manager.md) — root hub that routes events between agents.
- [WebSocket client manager](./websocket-client-manager.md) — agent-side connection to the hub.
- [Domain manager](./domain-manager.md) — the consumer that spawns domain agents for queue items.
- [Launcher](./launcher.md) — low-level child-process launch contract.
