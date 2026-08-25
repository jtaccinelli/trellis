# Overview

## What Trellis is

Trellis is a Pi extension that generates and coordinates **subagents** — focused child `pi` processes with isolated context windows — to decompose user requests and produce ratified scopes of work.

## What problem it solves

Large or ambiguous tasks tend to pollute the parent context window and collapse too early into a single plan. Trellis keeps context isolated by running specialists in child processes, surfaces natural disagreement between narrow domain agents, and requires a human sign-off gate before execution.

## Goals

1. Generate subagents from declarative markdown definitions.
2. Delegate work to isolated child `pi` processes.
3. Combine independent coordinator agents, an extension-runtime queue manager, and ephemeral domain agents into workflows, plus ad-hoc background subagent spawning.
4. Stay small and idiomatic: use Pi's built-in `--mode json` child-process contract, tool APIs, and TUI primitives.

## Non-goals (for now)

- Re-implementing the full `pi-subagents` surface (missions, watchdog, Herdr, Orca, external runners).
- Building a custom LLM client or runtime.
- Code generation / PR creation as part of the current scoping-focused build.

## Status

Extension is scaffolded. Behavior from a prior project is being ported into the Pi extension model.

## See also

- [Architecture](../40-architecture/)
- [API reference](../50-api/)
- [Concepts](../10-concepts/)
