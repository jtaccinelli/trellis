# Delegation Model

Delegation in Trellis matches **coordinator agents** (which own request context) with **domain agents** (which perform scope assessment or build execution for one domain). An extension-runtime **queue manager** sits between them so that coordinators never spawn domain agents directly and so that domain agents can be created fresh for every work item.

A **domain** is a project-defined area of responsibility. Domains are configured via `creating-domain` and are not discovered at runtime.

## Two subagent roles + one runtime component

| Type | Lifetime | Purpose |
|------|----------|---------|
| **Coordinator agent** | Session-scoped | Owns a slice of the request; creates requirements; enqueues them; tracks oscillation; gates final scope. |
| **Domain agent** | Ephemeral, one per work item | Consumes a single work item and returns its assessment or built artifact. |
| **Queue manager** | Extension runtime | Owns each domain's shared queue; serializes domain-agent execution; records completion. |

Coordinator agents and the queue manager live in the extension runtime. Domain agents are spawned by the queue manager, never by a coordinator agent.

## The shared domain queue

Each configured domain has exactly one FIFO work queue. Any coordinator in the session may enqueue to it. The extension queue manager consumes items serially.

```
Coordinator 1 ──┐
Coordinator 2 ──┼──▶ Domain A queue ──▶ Queue Manager
Coordinator 3 ──┘                       │
                                          ▼
                                    Spawns fresh Domain A agent
                                          │
                                          ▼
                                    Processes item, returns result
                                          │
                                          ▼
                                    Queue manager records completion
```

Because the queue manager serializes access, only one instance of a given domain agent can exist at any time. When the queue is empty, no domain agent for that domain exists.

## Work-item lifecycle

1. Coordinator creates a scope requirement assigned to a domain.
2. Coordinator calls `delegating-requirement({ domain_id, requirement_id })` to enqueue a work item on that domain's shared queue.
3. The queue manager appends the work item.
4. If no domain agent is currently running for that domain, the queue manager pulls the head item, marks it `running`, and spawns a fresh domain agent for that single item.
5. The domain agent performs its work and exits.
6. The queue manager records completion (updates the work item, posts a direct notification to the originating coordinator) as part of reaping the child.
7. If the queue still has items, the queue manager spawns the next domain agent immediately.
8. Meanwhile, the coordinator reads completed results and may enqueue new requirements, driving a recursive loop until all queues are stable.

## Agent instance rules

- Domain agents are **never long-lived**; a new one is spawned for each work item.
- Only one instance of a given domain agent may be running at any moment.
- The queue manager ensures serial execution and is the only thing that manages domain-agent lifecycle.
- The queue manager is part of the extension runtime, not a subagent; it outlives any individual domain agent.

## Foreground vs background

- Foreground delegation is implicit: the user invokes `scoping-item`, which drives the coordinator, which drives the domain queues. Progress streams back through the coordinator tool results.
- Ad-hoc background subagent spawning is explicit via `spawning-agent` and is separate from the domain-queue model.

## See also

- [API: delegating-requirement](../50-api/delegating-requirement.md)
- [API: scoping-item](../50-api/scoping-item.md)
- [Coordinator runtime](./coordinator-runtime.md)
- [Queue management](./queue-manager.md)
- [Launcher](./launcher.md)
