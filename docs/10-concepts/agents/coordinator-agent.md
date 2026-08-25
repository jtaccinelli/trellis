# Coordinator Agent

A **coordinator agent** is a session-scoped subagent that owns a slice of the request context and drives the recursive scoping/build loop.

## Responsibilities

- Capture the user’s request (root coordinator agent) or a partitioned slice of it (child coordinator agent).
- Create and own scope requirements.
- Enqueue requirements onto shared domain queues via `delegating-requirement`.
- Read domain-agent assessments from the storage adapter (and optional queue-manager notifications).
- Track how many times a requirement has been reassigned between domains (oscillation detection).
- Escalate to the user when agents disagree past a bounce threshold.
- Assemble and present the final scope document for human sign-off.

## What a coordinator agent does NOT do

- It does **not** evaluate whether a scope requirement is correct, complete, or well-formed.
- It does **not** decide which domain should own a requirement based on content.
- It does **not** synthesize or rewrite scope assessments.
- It does **not** manage domain-agent lifecycle or the queue manager.

All scope reasoning is delegated to domain agents.

## Hierarchy

- **Root coordinator agent:** created from the user’s initial `scoping-item` call.
- **Child coordinator agent:** spawned when a request is large enough to benefit from partitioned context.

## Shorthand

In architecture and API docs this is often shortened to **coordinator**.

## See also

- [Domain agent](./domain-agent.md)
- [Architecture: Coordinator runtime](../../40-architecture/coordinator-runtime.md)
- [Architecture: Queue management](../../40-architecture/queue-manager.md)
- [API: scoping-item](../../50-api/scoping-item.md)
