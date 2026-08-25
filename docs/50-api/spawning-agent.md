# `spawning-agent`

Spawn a background subagent from inside another agent.

## Schema

```typescript
Type.Object({
  agent: Type.String({ description: "Agent name" }),
  task: Type.String({ description: "Task prompt" }),
  cwd: Type.Optional(Type.String()),
  notify: Type.Optional(Type.Boolean()), // when true, extension runtime sends the caller a direct message on completion
});
```

## Behavior

- Returns the new agent id immediately so the caller can continue.
- The spawned agent appears as a child of the caller in the lineage tree.
- Extension registers ambient tools inside the child so it can message or spawn further.

## Constraints

- Max tree depth: 4.
- Max children per agent: 8.
- Max active agents per session: 32.

## Result

```typescript
{
  content: [{ type: "text", text: `Spawned <agent> as <id>` }],
  details: { agentId: string }
}
```

## See also

- [Lineage and spawn](../40-architecture/lineage-and-spawn.md)
- [Launcher](../40-architecture/launcher.md)
