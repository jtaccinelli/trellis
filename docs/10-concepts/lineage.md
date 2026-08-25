# Lineage

**Lineage** is the recorded tree of recursive subagent spawns. Every spawn writes a parent/child link to the shared registry so the TUI can render the agent hierarchy.

## How it is recorded

When an agent spawns a child:

1. The child's `meta.json` is created before the process starts.
2. The parent's `meta.json` `children` array is updated to include the child's id.

This gives an authoritative tree without a separate global tree file.

## Limits

To prevent runaway recursion, Trellis enforces:

- Max tree depth.
- Max children per agent.
- Max active agents per session.

## See also

- [Lineage and spawn architecture](../40-architecture/lineage-and-spawn.md)
- [API: spawning-agent](../50-api/spawning-agent.md)
