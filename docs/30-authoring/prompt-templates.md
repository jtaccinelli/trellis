# Prompt Templates

Workflow prompt templates live under `prompts/*.md` and are exposed through Pi's prompt-template mechanism.

## Locations

- Package: `prompts/*.md` or `package.json` `pi.prompts` entries.
- User: `~/.pi/agent/prompts/*.md`.
- Project: `.pi/prompts/*.md` (after trust).

## Format

```markdown
---
description: Scout the codebase and produce a plan
---

Use scoping-item to start a scoping session...
```

## Bundled templates

- `/scoping-item` — starts a `scoping-item` session and lets the coordinator runtime drive domain agents.
- `/review-loop` — coordinates multiple reviewers through a scoping session.

## See also

- Pi prompt-template docs for argument substitution rules.
