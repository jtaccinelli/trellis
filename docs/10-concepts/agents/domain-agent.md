# Domain Agent

A **domain agent** is an ephemeral subagent that performs scope assessment or build execution for a single work item.

## Lifetime

- Spawned **fresh for every work item**; never persists between items.
- Created by the extension’s queue manager, not by coordinators.
- Torn down as soon as its result is recorded.

## Responsibilities during scoping

For a scope requirement, the domain agent returns:

1. **Owned scope** — what this domain commits to doing.
2. **Contracts** — what the domain needs from other domains, including expected output shape.
3. **Absorption notes** — scope intentionally taken by an `above` domain.
4. **Escalation request** — when the agent cannot decide ownership or detects a conflict.

## Responsibilities during implementation

During build phases, the domain agent writes or modifies code for the assigned item and runs automated checks under the queue manager’s supervision.

## Constraints

- Only one instance of a given domain agent may run at any moment, enforced by the queue manager.
- Domain agents are one-shot; no state leaks between work items.

## See also

- [Coordinator agent](./coordinator-agent.md)
- [Architecture: Delegation](../../40-architecture/delegation.md)
- [Architecture: Queue management](../../40-architecture/queue-manager.md)
- [Data model: DomainAgent](../../60-data-model/entities.md)
