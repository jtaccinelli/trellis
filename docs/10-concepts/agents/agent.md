# Agent

An **agent** is a declarative specialist definition. In Trellis, agents are static, bundled markdown files with YAML frontmatter and a system-prompt body.

## Frontmatter

| Field | Purpose |
|---|---|
| `name` | Unique identifier used in tool calls and launchers. |
| `description` | One-liner for routing and discovery. |
| `model` | Optional pinned model; otherwise inherits the parent’s model and thinking level. |
| `tools` | Optional allowlist of tools the agent may use. |
| `thinking` | Optional thinking level, only honored when `model` is pinned. |
| `output` | Optional file path to write the final answer. |

## System-prompt body

The body defines identity, task format, and required output schema. It is injected into the child `pi` process via `--append-system-prompt`.

## Runtime mapping

- An agent definition maps to a **child `pi` process** at runtime.
- Agents are loaded from bundled `agents/*.md`; there is no user- or project-level agent discovery.
- Domains choose which bundled agent to use via `agent_definition_id` in `creating-domain`.

## See also

- [Subagent](./subagent.md)
- [Authoring: Agent definitions](../../30-authoring/agent-definitions.md)
- [Architecture: Launcher](../../40-architecture/launcher.md)
