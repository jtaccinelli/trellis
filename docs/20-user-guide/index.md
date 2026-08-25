# User Guide

How to install, load, and use Trellis once it is built.

## Install

Trellis uses `~/*` TypeScript path aliases for type-checking. Pi's runtime loader does not resolve them, so the extension must be bundled first.

```bash
pnpm install
pnpm run build
```

This produces `dist/extensions/index.js` and copies the SQLite schema files into `dist/`.

### From the repo (after pushing to GitHub)

```bash
pi install git:github.com/jtaccinelli/trellis
```

### Local development

```bash
# Load the built extension for the current run only
pi -e ~/Sites/trellis

# Or symlink the built entry point into Pi's auto-discovery path
ln -s ~/Sites/trellis/dist/extensions/index.js ~/.pi/agent/extensions/trellis.js
```

## Quickstart

- TODO: one-liner to start a scoping session with `scoping-item` or `/scoping-item`.
- TODO: example of inspecting an active scoping session with `inspecting-scope`.

## Tool surface

Trellis exposes a small set of custom tools. All use gerund-noun naming and have no `trellis_` prefix:

- `scoping-item` — start a recursive domain-scoped scoping session.
- `delegating-requirement` — internal coordinator tool that enqueues requirements onto a shared domain queue.
- `spawning-agent` — background recursive subagent spawn.
- `sending-message`, `receiving-message` — user steering notes and runtime notifications.
- `listing-agents` — read-only agent registry introspection.
- `creating-domain`, `listing-domains` — domain taxonomy management.
- `inspecting-scope`, `inspecting-queue` — inspect scoping/queue state.
- `resolving-conflict` — resolve escalated requirements during sign-off.
- `querying-items`, `upserting-item`, `linking-requirement`, `resolving-item-conflict` — item cataloguing (used during scoping).

## Slash commands

Trellis registers a small number of slash commands for interactive entry points:

- `/scoping-item` — start a scoping session from the command palette.
- `/building-item` — start building a ratified item.
- `/reviewing-item` — start reviewing a built item.
- `/cataloging-project` — catalog existing project items.
- `/inspecting-tree` — open the interactive session/agent tree inspector.

## Security notes

- Agents are predefined and bundled with Trellis; there is no runtime agent discovery from user or project directories.
- Extensions run with full system permissions; only install Trellis from a trusted source.
