# Background Work Tools

## `spawning-agent`

Spawn a background subagent from inside another agent.

### Purpose

Allow a long-running agent (e.g., a coordinator or a worker) to start another agent that runs in parallel. The caller receives an agent id immediately and may continue its own work.

This is **separate from the domain-queue model**: `delegating-requirement` writes to a serialized domain queue, while `spawning-agent` creates an independent background child.

### Who calls it

Any agent that is already running: coordinators, background workers, or other long-lived agents.

### Schema

```typescript
Type.Object({
  agent: Type.String({ description: "Agent name" }),
  task: Type.String({ description: "Task prompt" }),
  cwd: Type.Optional(Type.String()),
  notify: Type.Optional(Type.Boolean()), // when true, send the caller a direct message on completion
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `agent` | yes | Name of the bundled agent definition to spawn. |
| `task` | yes | Prompt describing the child agent's task. |
| `cwd` | no | Working directory for the child. |
| `notify` | no | If true, the runtime sends the caller a direct message when the child exits. |

### What happens

1. The extension launcher resolves the named agent from the bundled catalog (`agents/*.md`).
2. A new child `pi` process is started with `--mode json -p --no-session` and the agent's system prompt injected.
3. Environment variables identify the child: `TRELLIS_AGENT_ID`, `TRELLIS_PARENT_ID`, `TRELLIS_SESSION_ID`, `TRELLIS_ROLE=background`.
4. The child appears under the caller in the lineage tree.
5. The caller receives the new agent id and continues.

### Limits

| Limit | Value |
|-------|-------|
| Max tree depth | 4 |
| Max children per agent | 8 |
| Max active agents per session | 32 |

### Result

```typescript
{
  content: [{ type: "text", text: `Spawned <agent> as <id>` }],
  details: { agentId: string }
}
```

### Example use

A coordinator implementing a build wave might spawn:

> `spawning-agent({ agent: "frontend-builder", task: "Implement the avatar upload component from scope item FRONTEND-12.", notify: true })`

### See also

- [Lineage and spawn](../40-architecture/lineage-and-spawn.md)
- [Launcher](../40-architecture/launcher.md)
- [API reference: spawning-agent](../50-api/spawning-agent.md)
