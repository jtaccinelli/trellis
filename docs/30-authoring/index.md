# Agents & Prompts

Trellis ships with a predefined set of specialist agents. Configurability comes from **domain settings** (`creating-domain`), not from adding new agent files at runtime.

## What is a Trellis agent?

A bundled markdown file with YAML frontmatter describing identity, optional model/tools, and a system-prompt body.

```markdown
---
name: scout
description: Fast codebase recon that returns compressed context for handoff
tools: read, grep, find, ls, bash
model: claude-haiku-4-5
thinking: low
---

You are a scouting subagent running inside pi.
...
```

Agents are loaded statically from the Trellis package at startup. The domain layer decides which agent handles which domain.

## Topics in this section

- [Agent definitions](./agent-definitions.md) — frontmatter schema, prompt body conventions, tool allowlists.
- [Prompt templates](./prompt-templates.md) — workflow templates such as `/scout-and-plan`.

## See also

- [Domain management tools](../50-api/domains.md)
- [Architecture: launcher](../40-architecture/launcher.md)
