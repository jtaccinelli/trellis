# Lineage and Spawn

Trellis lets any running agent create child agents. Each spawn is recorded in a shared lineage tree so parent, children, and the TUI can reason about the agent hierarchy.

## Agent identity

Every Trellis-aware child receives, via environment variables and appended system-prompt text:

- `TRELLIS_AGENT_ID` — canonical id, e.g. `trellis:0a1b2c3d`.
- `TRELLIS_PARENT_ID` — id of the agent that spawned this one, or `root`.
- `TRELLIS_SESSION_ID` — mailbox/session directory id.
- `TRELLIS_MAILBOX_DIR` — absolute path to the shared mailbox directory.
- `TRELLIS_MAILBOX_DIR` — session directory used for the shared agent registry and per-agent state.

## Registry record (`AgentMeta`)

```typescript
interface AgentMeta {
  id: string;
  parentId: string | "root";
  agentName: string;
  task: string;
  cwd: string;
  model?: string;
  status: "running" | "completed" | "failed" | "aborted";
  spawnedAt: number;
  completedAt?: number;
  children: string[];
  exitCode?: number;
  errorMessage?: string;
}
```

When an agent is spawned, its `meta.json` is created before the child starts. The parent writes its own `children` array at the same time. This builds an authoritative lineage tree without a separate tree file.

## Spawn modes

- **Domain-queue delegation** (`delegating-requirement`): coordinators use this to enqueue a scope requirement on a domain's shared queue. The call returns a receipt quickly; results arrive asynchronously via the messaging layer.
- **Background** (`spawning-agent`): returns an agent id immediately; the caller continues and can later poll or message the child.

## Background-run tracking

- The launcher records the child PID in `meta.json`.
- A one-shot exit handler writes `result.json` and updates `meta.json` status.
- `session_shutdown` walks the registry and escalates `SIGTERM` → `SIGKILL` for any still-running children.

## Child loading contract

For `spawning-agent`, the child `pi` process must load the Trellis extension. Messages from the user or the extension runtime may be delivered to it via the shared message table.

1. Detect how the current process loaded Trellis (`-e <path>` vs package auto-discovery).
2. If loaded by `-e`, propagate the same absolute path to the child argv.
3. The extension factory distinguishes root mode from agent mode by checking `process.env.TRELLIS_AGENT_ID`. In agent mode, only ambient tools (`sending-message`, `receiving-message`, `spawning-agent`, etc.) are registered.

## Recursion guards

- Max depth: 4.
- Max children per agent: 8.
- Max active agents per session: 32.
- Checked against the shared registry before spawning.

## See also

- [API: spawning-agent](../50-api/spawning-agent.md)
- [API: messaging tools](../50-api/messaging.md)
- [Messaging](./messaging.md)
