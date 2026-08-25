# Queue Management

Queue management is an extension-runtime responsibility, not an agent role. The extension owns each domain’s shared FIFO queue and serializes domain-agent execution.

> This document replaces the earlier “queue agent” subagent design. There is no queue-agent process.

## Responsibilities

1. Hold the FIFO queue for each domain in the storage adapter.
2. When `delegating-requirement` writes a new work item:
   - If the domain has no running domain agent, pull the head item, mark it `running`, and spawn a fresh domain agent.
   - If the domain already has a running domain agent, leave the item queued; the running agent will drain it on exit.
3. When a domain agent exits (detected by the parent process’s child-exit handler):
   - Mark the current work item `done` or `failed`.
   - Read the agent’s `result.json` and store it as `WorkItem.result_payload`.
   - Hand off coordinator notification to the **notification manager**, which inserts a `Message` for the originating coordinator (`from_agent_id: "queue-manager"`) and emits `trellis:notification_pending` from the main thread. The coordinator does not poll for completion.
   - Pull the next head item and spawn the next domain agent, or go idle if the queue is empty.
4. On `session_shutdown`, reap any running children and persist queue state.

## Why not an agent?

Queue management is purely operational: peek a queue, spawn a child, wait for exit, repeat. There is no scope reasoning required. Putting it in the extension runtime:

- Avoids a long-running subagent per active domain.
- Keeps queue logic deterministic and prompt-free.
- Prevents a dying domain agent from being responsible for spawning its own replacement.
- Lets the coordinator stay focused on request context and oscillation detection.

## Data structures

The queue manager keeps an in-memory map per active session:

```
domain_id → {
  running: domain_agent_id | null,
  pending_spawn: boolean,
}
```

The canonical queue state is the `work_items` table in the storage adapter.

## Spawn contract

The queue manager calls the launcher with:

- `TRELLIS_ROLE=domain`
- `TRELLIS_AGENT_ID` — canonical domain agent id.
- `TRELLIS_DOMAIN_ID` — the domain being processed.
- `TRELLIS_WORK_ITEM_ID` — the work item to process.
- `TRELLIS_SESSION_ID`, `TRELLIS_MAILBOX_DIR` as needed.

The launcher uses the same `--mode json -p --no-session` argv used for coordinator agents.

## Processing loop

```
function onDelegation(domain_id):
  enqueue work_item
  if not hasRunningAgent(domain_id):
    startNextAgent(domain_id)

function startNextAgent(domain_id):
  item = peekHead(domain_id, status = queued)
  if item is null: return
  mark item running
  spawn domain agent for item
  register on-exit handler for that child

function onDomainAgentExit(domain_id, agent_id, exitInfo):
  item = current work_item for domain_id
  update item.status = done | failed
  update item.result_payload = read result.json or error summary
  insert Message {
    from_agent_id: "trellis:queue-manager",
    to_agent_id: item.enqueued_by_coordinator_id,
    payload: JSON.stringify({ work_item_id: item.id, status: item.status }),
  }
  remove running marker for domain_id
  startNextAgent(domain_id)
```

## Instance rules

- At most one domain agent runs per domain at any time.
- The queue manager spans the whole session; it is not torn down between items.
- It does not assess scope content; it only moves items through their lifecycle.

## Failure handling

- If a domain agent exits with a failure, the queue manager marks the work item `failed`.
- A configurable retry count allows requeueing the same scope requirement with a new domain agent.
- Repeated failures are surfaced to the coordinator as an escalation.

## See also

- [Delegation model](./delegation.md)
- [Coordinator runtime](./coordinator-runtime.md)
- [API: delegating-requirement](../50-api/delegating-requirement.md)
- [Data model: WorkItem](../60-data-model/entities.md)
