# Agent Definitions

Trellis agents are **static, bundled definitions**. You do not add new agents at runtime; instead, you configure which domain uses which bundled agent via `creating-domain` (`agent_definition_id`).

The bundled agent catalog includes at least:

- `coordinator` — routes requirements and tracks oscillation.
- `domain-agent` — ephemeral assessor/builder spawned per work item.

Queue management is handled by the extension runtime, not by an agent.

## Frontmatter schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Unique identifier used in tool calls. |
| `description` | string | yes | One-liner shown to the parent model for routing. |
| `tools` | string[] \| comma-separated string | no | Restricts the child's active tool set. |
| `model` | string | no | If omitted, inherits parent's active model + thinking level. |
| `thinking` | string | no | Only honored when `model` is pinned; otherwise inherited. |
| `output` | string | no | Optional file path to write final answer. |

## System prompt body

- Keep the body focused on identity, task format, and any required output schema.
- Domain agents must return: (1) what they own, (2) narrower requirements/contracts for other domains, (3) absorption notes.

## Loading

Agents are read from `agents/*.md` inside the Trellis package and exposed through `resources_discover` at startup. There is no user- or project-level agent directory.

## Tool allowlists

- Omit `tools` to inherit the parent's entire active tool set.
- Prefer narrow allowlists for read-only or focused agents.

## Example agents

### Scout

- TODO: fill in sample agent.

### Worker

- TODO: fill in sample agent.

### Reviewer

- TODO: fill in sample agent.

## See also

- [Domain management tools](../50-api/domains.md)
- [Architecture: launcher](../40-architecture/launcher.md)
