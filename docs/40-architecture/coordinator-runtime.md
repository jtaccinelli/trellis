# Coordinator Runtime

The coordinator runtime drives recursive scoping inside a session. It may run as a subagent (for large requests) or as part of the Trellis extension in the parent Pi session.

## Responsibilities

1. Capture the user's request (root coordinator) or a scoped slice of it (child coordinator).
2. Create the session record and initial scope requirement(s).
3. Enqueue work items onto the appropriate **shared domain queues** using `delegating-requirement`.
4. Read domain-agent results from the storage adapter (and optionally from a direct notification sent by the queue manager).
5. Record each domain agent's assessment: owned scope, contracts for other domains, absorption notes, and any escalation request.
6. Track how many times a scope requirement has been reassigned between domains (oscillation / ping-pong count).
7. Escalate to the user when agents disagree too many times about where a requirement should live.
8. Loop until all queues are stable and no new requirements are produced.
9. Assemble and present a final scope document.
10. Gate on human approval, rejection, or abandonment.

Coordinators never spawn domain agents directly; they only enqueue work items. Domain agents are ephemeral and are created by the extension's queue manager for each work item.

## What the coordinator does NOT do

- It does **not** evaluate whether a scope requirement is correct, complete, or well-formed.
- It does **not** decide which domain should own a requirement based on content.
- It does **not** synthesize or rewrite scope assessments.
- It does **not** manage the lifecycle of domain agents or the queue manager.

All scope reasoning is performed by domain agents. The coordinator's judgment is limited to process health: detecting endless back-and-forth.

## Recursive scoping loop

```
Coordinator
    │
    ▼
delegating-requirement() for each requirement
    │
    ▼
Queue manager spawns fresh domain agents serially
    │
    ▼
Domain agents return assessments
    │
    ▼
Coordinator records assessments
    │
    ▼
New requirements or contracts?  ──yes──▶ enqueue them again
    │
    no
    ▼
All queues stable?  ──no──▶ wait for notification / resume
    │
    yes
    ▼
Finalize scope document
```

See [Communication pathways](./communication-pathways.md) for full message/state flows.

## Loop invariants

- One coordinator per partitioned scope slice.
- Domain agents are ephemeral: one fresh instance per work item, spawned by the queue manager.
- Only one instance of a given domain agent may run at any moment.
- Each domain owns one FIFO queue; all coordinators enqueue to that same queue.
- The queue manager consumes items serially and records completion on child exit.
- Coordinator is the hub: agents do not talk to each other.
- Coordinator never evaluates scope content.
- Absorption flows upward only.
- Termination occurs when every queued item is processed and no new requirements are produced.

## Oscillation detection

```
Domain A owns requirement F
        │
        ▼
Domain A says F belongs to Domain B
        │
        ▼
Domain B says F belongs back to Domain A
        │
        │ (repeat)
        ▼
Bounce count >= threshold
        │
        ▼
Coordinator escalates to user
```

The coordinator increments a `reassignment_count` each time a requirement is handed off to a different domain. When the count crosses a configurable threshold, the requirement is marked `escalated` and the user decides via the sign-off gate.

## Human sign-off gate

Present the final scope via a custom UI overlay or confirmation dialog. Outcomes:

- `approved` → ratified; hand off to future execution layer (out of scope for now).
- `rejected` → coordinator refines using feedback.
- `abandoned` → session closed.

## Recovery

On `session_start`, rebuild coordinator state from the storage adapter and from transient session entries stored via `pi.appendEntry()`.
