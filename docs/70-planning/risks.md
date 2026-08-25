# Risks

## Context overflow from child output

- Mitigation: truncate parallel outputs to 50 KB; keep full output in `details`.
- Future: per-run token/turn budgets.

## Runaway children

- Mitigation: `SIGTERM` → `SIGKILL` escalation; recursion guards (depth, breadth, active cap).
- Future: per-child turn/tool/usage budgets and timeouts.

## Stale agent definitions

- Agent definitions are bundled with Trellis; updating them requires updating the package.
- Mitigation: domain-level configuration is separate and editable at runtime via `creating-domain`.

## Context pollution

- Mitigation: domain agents use `--no-session` fresh context; coordinators remain session-scoped.

## Process management

- Mitigation: launcher cleans up temp files in `finally`; `session_shutdown` terminates lingering children.

## Storage portability

- Mitigation: storage adapter interface hides SQLite/Cloudflare specifics.

## Premature convergence

- Mitigation: deliberate antagonism; the coordinator never judges scope content. Escalations happen only when domain agents oscillate past the bounce threshold.
