# Communication Pathways

This document describes the message and state flows between Trellis subagents and the extension runtime, including the loops that drive recursive scoping.

## Actors

- **Coordinator agent** (root or child) — owns a slice of request context, creates scope requirements, enqueues work, records results, detects oscillation.
- **Queue manager** — extension-runtime component that owns each domain's FIFO queue and spawns fresh domain agents serially.
- **Domain agent** — ephemeral agent spawned by the queue manager for exactly one scope requirement or item.

## One-item path (no new requirements)

```
Coordinator
    │  delegating-requirement(domain_id, requirement_id)
    ▼
Shared Domain Queue
    │
    ▼
Queue Manager
    │  spawns fresh domain agent (if idle)
    ▼
Domain Agent ──▶ WorkItem.status = "running"
    │
    ▼
Domain Agent exits with result
    │
    ▼
Queue Manager ──▶ WorkItem.status = "done", writes result message
    │
    ▼
Coordinator reads result and updates Requirement
```

No direct message passes between coordinator and domain agent.

## Recursive scoping loop

A coordinator does not stop after the first batch of requirements. Each assessment can produce narrower child requirements or contracts that belong to other domains, so the coordinator enqueues those and waits again.

```
Coordinator creates initial Requirements
         │
         ▼
For each requirement: delegating-requirement() into target domain queue
         │
         ▼
Queue manager consumes items serially and spawns fresh Domain Agents
         │
         ▼
Domain Agents return assessments
         │
         ▼
Coordinator records each assessment
         │
         ▼
Are there new/contract requirements or reassignments?
    ┌─────┴─────┐
    │           │
    yes         no
    │           │
    ▼           ▼
Enqueue     All queues stable?
 new items      │
    │           ▼
    │      yes  ──▶ finalize scope document
    │           │
    │           no
    └───────────┘
```

Loop invariants:

- The coordinator is the only entity that creates new scope requirements from assessments.
- Domain agents never create requirements; they only describe what should exist.
- Coordinators do not synthesize scope content; they route based on domain assignments recorded by domain agents.
- The loop terminates when every queue is stable and no new requirements or contracts appear.

## Oscillation / escalation loop

When domain agents disagree about which domain owns a requirement, the coordinator tracks reassignment.

```
Domain A assessment: "Requirement R belongs in Domain B"
         │
         ▼
Coordinator reassigns F to Domain B and enqueues it
         │
         ▼
Domain B assessment: "Requirement R belongs back in Domain A"
         │
         ▼
Coordinator increments reassignment_count
         │
         ▼
reassignment_count < threshold?
    ┌─────┴─────┐
    │           │
    yes         no
    │           │
    ▼           ▼
Requeue     Mark F escalated
 to B          │
               ▼
         Surface to human sign-off gate
```

The coordinator does not resolve the conflict itself; it only counts bounces and escalates.

## Cross-coordinator sharing

Multiple coordinators (root and child) may enqueue to the same domain queue. Their results do not merge into a single coordinator conversation. Instead:

- All coordinators write to the same `WorkItem` / `Requirement` store.
- The queue manager serializes consumption so only one domain agent runs at a time.
- Each coordinator reads from the storage adapter independently.
- A coordinator may receive a direct notification from the queue manager when one of its work items completes. The coordinator reads the actual result from the `WorkItem` row.

## Ad-hoc background spawn pathway

Separate from the scoping loop:

```
Any agent calls spawning-agent({ agentName, task, ... })
         │
         ▼
Launcher creates child pi process
         │
         ▼
Child agent loads Trellis extension in domain-agent mode
         │
         ▼
Parent and child communicate via direct messages or shared state
         │
         ▼
On exit, result.json is written and AgentMeta is updated
```

## State surfaces

Most coordination does not happen through direct messages. It happens through durable state:

- `Requirement` — what is being scoped and who currently owns it.
- `WorkItem` — what is queued/running/done and where the result lives.
- `Item` (future) — durable artifact leaves inside a domain.
- `Message` — for root/extension runtime notifications and user steering notes to running agents.
- `AgentMeta` — for background-spawn lineage.

## See also

- [Delegation model](./delegation.md)
- [Queue management](./queue-manager.md)
- [Coordinator runtime](./coordinator-runtime.md)
- [Messaging](./messaging.md)
- [Lineage and spawn](./lineage-and-spawn.md)
- [Data model entities](../60-data-model/entities.md)
