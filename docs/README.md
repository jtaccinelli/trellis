# Trellis Documentation

Trellis is a [pi](https://pi.dev) extension that turns the raw subagent primitive into a structured, observable, recursive scoping and delegation system. These docs are organized by audience and by the Pi primitives they build on.

## How this is organized

| Directory | Audience | Pi primitives it maps to |
|-----------|----------|--------------------------|
| [`01-overview/`](./01-overview/) | Everyone | Project goals, status, non-goals |
| [`10-concepts/`](./10-concepts/) | Readers learning the mental model | Agent, coordinator, domain, scope requirement, contract, lineage |
| [`20-user-guide/`](./20-user-guide/) | End users | Installing, slash commands, tool usage |
| [`30-authoring/`](./30-authoring/) | Framework authors / curious users | Bundled agent definitions and workflow prompt templates |
| [`35-actions/`](./35-actions/) | Framework authors / contributors | Repeatable workflows such as cataloguing items and delegating requirements |
| [`40-architecture/`](./40-architecture/) | Contributors | `session_start`, `registerTool`, `details`, `appendEntry`, `registerCommand`, `custom()` overlays, `resources_discover` |
| [`tools/`](./tools/) | End users / agents | User-facing guide to every Trellis extension tool |
| [`50-api/`](./50-api/) | Integrators / the LLM | Formal tool schemas and behavior for every Trellis tool |
| [`60-data-model/`](./60-data-model/) | Contributors | Session entities, storage adapter, persistence boundaries |
| [`70-planning/`](./70-planning/) | Maintainers | Roadmap, decision log, risks |

## Legacy docs

The original planning documents live in [`_legacy/`](./_legacy/). They are being broken apart and migrated into the structure above.

## Status

Scaffolded. Most files below are outlines and `TODO` markers waiting for content.
